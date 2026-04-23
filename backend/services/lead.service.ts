import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import LeadRepository from '../repositories/lead.repository';
import { autoAssignLead } from '../utils/assignment';
import CommunicationService from './communication.service';


export class LeadService {
  async createLead(data: any) {
    // duplicate check by phone
    const existingLead = await LeadRepository.findMany({
      where: { phone: data.phone },
    });

    if (existingLead.length > 0) {
      throw new Error('Lead with this phone number already exists');
    }

    const lead = await LeadRepository.create({
      ...data,
      tag: data.tag || 'COLD'
    });

    // Automatic Assignment
    const assignedLead = await autoAssignLead(lead.id);

    // Notify assigned assignedTo/telecaller
    if (assignedLead && assignedLead.assignedId) {
      const assignedTo = await prisma.user.findUnique({
        where: { id: assignedLead.assignedId }
      });
      if (assignedTo) {
        await CommunicationService.sendassignedToNotification(assignedTo, assignedLead);
      }
    }

    // Automated Communication
    await CommunicationService.sendAutoResponse(lead);

    // Initial Scoring
    await this.calculateLeadScore(lead.id);

    // Activity Logging
    const AuditService = (await import('./audit.service')).default;
    await AuditService.log(`New lead created: ${lead.name}`, undefined, { leadId: lead.id, source: lead.leadSource });

    return lead;
  }

  async handlePublicApplication(data: any) {
    const prisma = (await import('../config/prisma')).default;
    // Check for existing lead by email or phone
    const existingLead = await prisma.lead.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone }
        ]
      },
      include: { assignedTo: true }
    });

    if (existingLead) {
      // 1. Update existing lead
      const updatedLead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          location: data.location || existingLead.location,
          eduBackground: data.eduBackground || existingLead.eduBackground,
          qualification: data.qualification || existingLead.qualification,
          stage: 'RESPONDED', // Move to Responded as they took action
          updatedAt: new Date()
        }
      });

      // // 2. Add a system note
      // await this.addNote(existingLead.id, 'Student re-applied via public portal.', 'REMARK', existingLead.assignedId || 'system');

      // // 3. Schedule a priority follow-up for the assignedTo
      // if (existingLead.assignedId) {
      //   await prisma.followUp.create({
      //     data: {
      //       leadId: existingLead.id,
      //       assignedId: existingLead.assignedId,
      //       notes: 'Priority: Student re-applied via public portal. Please contact ASAP.',
      //       scheduledAt: new Date(Date.now() + 1 * 60 * 60 * 1000) // +1 hour
      //     }
      //   });
      // }

      // 4. Audit Log
      const AuditService = (await import('./audit.service')).default;
      await AuditService.log(`Existing lead re-applied: ${existingLead.name}`, undefined, { leadId: existingLead.id });

      return updatedLead;
    }

    // If no existing lead, create a new one
    return this.createLead({
      ...data,
      leadSource: data.leadSource || 'Website'
    });
  }

  async calculateLeadScore(id: string) {
    const lead = await LeadRepository.findUnique(id);
    if (!lead) return 0;

    let score = 0;
    if (lead.email) score += 20;
    if (lead.location) score += 10;
    if (lead.interestedProgramId) score += 20;
    if (['Google Ads', 'Website'].includes(lead.leadSource)) score += 30;

    return await LeadRepository.update(id, { priority: score });
  }

  async getAllLeads(filter: any, requestingUser?: any) {
    const { page = 1, limit = 10, stage, assignedId, tag } = filter;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (stage) where.stage = stage;
    if (tag) where.tag = tag;

    // --- ENFORCE DATA PRIVACY (RBAC) ---
    if (requestingUser) {
      const userRole = typeof requestingUser.role === 'string' ? requestingUser.role : requestingUser.role?.type;
      
      const isTeamMember = userRole === 'TELECALLER' || userRole === 'COUNSELOR';
      
      if (isTeamMember) {
        // Telecallers, Counselors, and assignedTos only see leads assigned to them via assignedId (owner field)
        where.assignedId = requestingUser.id;
      } else if (assignedId) {
        // Admins can still filter by specific assignedId if they want
        where.assignedId = assignedId;
      }
    } else if (assignedId) {
      where.assignedId = assignedId;
    }

    // Get total count for pagination
    const total = await LeadRepository.count(where);

    const leads = await LeadRepository.findMany({
      skip,
      take,
      where,
      orderBy: { updatedAt: 'desc' }, // Switched to updatedAt to keep active leads at the top
    });

    return {
      leads,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / take)
    };
  }

  async getLeadById(id: string) {
    const lead = await LeadRepository.findUnique(id);
    return lead;
  }

  async addNote(id: string, content: string, type: any, assignedId: string) {
    return await prisma.leadNote.create({
      data: {
        leadId: id,
        content,
        type: type || 'REMARK',
        assignedId
      },
      include: { assignedTo: { select: { name: true } } }
    });
  }

  async logInteraction(leadId: string, data: { type: string, message: string, direction: string, assignedId: string, duration?: number, result?: string }) {
    return await prisma.communicationLog.create({
      data: {
        leadId,
        type: data.type,
        message: data.message,
        direction: data.direction,
        status: 'SENT',
        duration: data.duration,
        result: data.result,
        assignedId: data.assignedId
      },
      include: { assignedTo: { select: { name: true } } }
    });
  }

  async updateLead(id: string, data: any, requestingUserId?: string) {
    const existingLead = await LeadRepository.findUnique(id);
    if (!existingLead) throw new Error('Lead not found');

    // --- AUTOMATED HANDOVER LOGIC ---
    // Detect if we are moving to Counseling Scheduled
    if (data.stage === 'COUNSELING_SCHEDULED' && existingLead.stage !== 'COUNSELING_SCHEDULED') {
      const { default: AssignmentService } = await import('./assignment.service');
      const assignedLead = await AssignmentService.assignToassignedTo(id);
      
      if (assignedLead && assignedLead.assignedId) {
        // Log a specialized handover note
        await this.addNote(
          id, 
          `Handover: Lead moved to COUNSELING_SCHEDULED. Automatically assigned to assignedTo: ${assignedLead.assignedTo?.name || 'Academic Team'}.`,
          'REMARK',
          requestingUserId || 'system'
        );
      }
    }

    return await LeadRepository.update(id, data);
  }

  async deleteLead(id: string) {
    const AuditService = (await import('./audit.service')).default;
    const lead = await LeadRepository.findUnique(id);
    if (lead) {
      await AuditService.log(`Lead deleted: ${lead.name}`, undefined, { leadId: id });
    }
    return await LeadRepository.delete(id);
  }

  async assignLead(id: string, assignedId: string) {
    return await LeadRepository.update(id, {
      assignedTo: { connect: { id: assignedId } }
    });
  }

  async getLeadStats(userId?: string, role?: string) {
    const isTeamMember = role === 'TELECALLER' || role === 'COUNSELOR';
    const filter = isTeamMember && userId ? { assignedId: userId } : {};

    const totalLeads = await LeadRepository.count(filter);

    const today = new Date(new Date().setHours(0, 0, 0, 0));

    const leadsToday = await LeadRepository.count({
      ...filter,
      createdAt: { gte: today }
    });

    const newLeads = await LeadRepository.count({
      ...filter,
      createdAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
      },
    });

    // Calculate admissions
    const admissions = await LeadRepository.count({
      ...filter,
      stage: 'ADMISSION_CONFIRMED'
    });

    // Calculate real revenue from successful payments
    const revenueAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS' }
    });
    const revenue = revenueAgg._sum.amount || 0;

    return {
      totalLeads,
      leadsToday,
      newLeads,
      admissions,
      revenue,
      trends: {
        leads: '+12.5%',
        newLeads: '+18.2%',
        admissions: '+5.4%',
        revenue: '+10.1%'
      }
    };
  }

  async reactivateLead(id: string, userId: string) {
    const lead = await LeadRepository.findUnique(id);
    if (!lead) throw new Error('Lead not found');

    if (lead.stage !== 'RE_ENGAGEMENT' && lead.stage !== 'LOST_LEAD') {
      throw new Error('Only RE_ENGAGEMENT or LOST leads can be reactivated');
    }

    // 1. Update lead stage
    const updatedLead = await LeadRepository.update(id, { stage: 'NEW_LEAD' });

    // 2. Add a system note
    await this.addNote(id, 'Lead reactivated from Re-engagement stage.', 'REMARK', userId);

    // 3. Create a follow-up task for the assignedTo
    if (updatedLead.assignedId) {
      await prisma.followUp.create({
        data: {
          leadId: id,
          assignedId: updatedLead.assignedId,
          notes: 'Welcome back follow-up: Student accepted re-engagement offer.',
          scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // +2 hours (asap)
        }
      });
    }

    // 4. Audit Log
    const AuditService = (await import('./audit.service')).default;
    await AuditService.log(`Lead reactivated: ${lead.name}`, userId, { leadId: id });

    return updatedLead;
  }
}

export default new LeadService();
