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

    const lead = await LeadRepository.create(data);

    // Automatic Assignment
    await autoAssignLead(lead.id);

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
      include: { counselor: true }
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

      // 2. Add a system note
      await this.addNote(existingLead.id, 'Student re-applied via public portal.', 'REMARK', existingLead.counselorId || 'system');

      // 3. Schedule a priority follow-up for the counselor
      if (existingLead.counselorId) {
        await prisma.followUp.create({
          data: {
            leadId: existingLead.id,
            counselorId: existingLead.counselorId,
            notes: 'Priority: Student re-applied via public portal. Please contact ASAP.',
            scheduledAt: new Date(Date.now() + 1 * 60 * 60 * 1000) // +1 hour
          }
        });
      }

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

  async getAllLeads(filter: any) {
    const { skip = 0, take = 10, stage, counselorId, tag } = filter;
    const where: any = {};

    if (stage) where.stage = stage;
    if (counselorId) where.counselorId = counselorId;
    if (tag) where.tag = tag;

    const leads = await LeadRepository.findMany({
      skip: Number(skip),
      take: Number(take),
      where,
      orderBy: { createdAt: 'desc' },
    });

    return leads;
  }

  async getLeadById(id: string) {
    const lead = await LeadRepository.findUnique(id);
    return lead;
  }

  async addNote(id: string, content: string, type: any, counselorId: string) {
    return await prisma.leadNote.create({
      data: {
        leadId: id,
        content,
        type: type || 'REMARK',
        counselorId
      },
      include: { counselor: { select: { name: true } } }
    });
  }

  async logInteraction(leadId: string, data: { type: string, message: string, direction: string, counselorId: string, duration?: number, result?: string }) {
    return await prisma.communicationLog.create({
      data: {
        leadId,
        type: data.type,
        message: data.message,
        direction: data.direction,
        status: 'SENT',
        duration: data.duration,
        result: data.result,
        counselorId: data.counselorId
      },
      include: { counselor: { select: { name: true } } }
    });
  }

  async updateLead(id: string, data: any) {
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

  async assignLead(id: string, counselorId: string) {
    return await LeadRepository.update(id, {
      counselor: { connect: { id: counselorId } }
    });
  }

  async getLeadStats() {
    const totalLeads = await LeadRepository.count();

    const today = new Date(new Date().setHours(0, 0, 0, 0));

    const leadsToday = await LeadRepository.count({
      createdAt: { gte: today }
    });

    const newLeads = await LeadRepository.count({
      createdAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
      },
    });

    // Calculate admissions
    const admissions = await LeadRepository.count({
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

    // 3. Create a follow-up task for the counselor
    if (updatedLead.counselorId) {
      await prisma.followUp.create({
        data: {
          leadId: id,
          counselorId: updatedLead.counselorId,
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
