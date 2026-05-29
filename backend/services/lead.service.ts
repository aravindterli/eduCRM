import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import LeadRepository from '../repositories/lead.repository';
import { autoAssignLead } from '../utils/assignment';
import CommunicationService from './communication.service';
import NotificationDispatcher from './notificationDispatcher.service';


export class LeadService {
  async createLead(tenantId: string, data: any) {
    // duplicate check by phone within tenant
    const existingLead = await LeadRepository.findMany(tenantId, {
      where: { phone: data.phone },
    });

    if (existingLead.length > 0) {
      throw new Error('Lead with this phone number already exists in your organization');
    }

    const { tag, ...restData } = data;
    const lead = await LeadRepository.create(tenantId, {
      ...restData,
      stage: restData.stage || 'NEW'
    });

    // Automatic Assignment
    const assignedLead = await autoAssignLead(tenantId, lead.id);

    // Initial Scoring
    await this.calculateLeadScore(tenantId, lead.id);

    // Activity Logging
    const AuditService = (await import('./audit.service')).default;
    await AuditService.log(tenantId, `New lead created: ${lead.name}`, undefined, { leadId: lead.id, source: lead.leadSource });

    // ── Notification Triggers (Consolidated) ──────────────────────────────────────────────
    
    // L1: Welcome to lead (Email + WhatsApp)
    NotificationDispatcher.enqueueFromTrigger({
      tenantId,
      trigger: 'LEAD_CREATED',
      eventTime: new Date(),
      leadId: lead.id,
      contactInfo: lead.email || lead.phone,
      payload: { name: lead.name, phone: lead.phone, email: lead.email || '', source: lead.leadSource },
    }).catch(() => { });

    // A1: Notify Admins of new lead
    const adminUsers = await prisma.user.findMany({ where: { role: { type: 'ADMIN' } } });
    for (const admin of adminUsers) {
      NotificationDispatcher.enqueueFromTrigger({
        tenantId,
        trigger: 'LEAD_CREATED',
        eventTime: new Date(),
        leadId: lead.id,
        recipientId: admin.id,
        payload: { leadName: lead.name, source: lead.leadSource },
      }).catch(() => { });
    }


    // T1: New lead assigned (Staff Alert) + L2: Lead Assignment Notification (Student Alert)
    const assignedId = assignedLead?.assignedId || lead.assignedId;
    if (assignedId) {
      const assignedUser = await prisma.user.findUnique({ 
        where: { id: assignedId },
        include: { role: true }
      });
      
      NotificationDispatcher.enqueueFromTrigger({
        tenantId,
        trigger: 'LEAD_ASSIGNED',
        eventTime: new Date(),
        leadId: lead.id,
        recipientId: assignedId,
        contactInfo: lead.phone || lead.email, // Passing lead info here allows the LEAD_ASSIGNED rules to target the lead too!
        payload: { 
          name: lead.name, 
          staffName: assignedUser?.name || 'Your Counselor',
          source: lead.leadSource,
          leadPhone: lead.phone 
        },
      }).catch(() => { });
    }


    return lead;
  }

  async handlePublicApplication(tenantId: string | any, data?: any) {
    const prisma = (await import('../config/prisma')).default;

    let actualTenantId = tenantId;
    let actualData = data;

    if (!data && typeof tenantId === 'object') {
      actualData = tenantId;
      const firstTenant = await prisma.tenant.findFirst();
      actualTenantId = firstTenant?.id || '';
    }

    const tenantIdStr = actualTenantId as string;
    const dataObj = actualData || {};

    // Check for existing lead by email or phone within tenant
    const existingLead = await prisma.lead.findFirst({
      where: {
        tenantId: tenantIdStr,
        OR: [
          { email: dataObj.email },
          { phone: dataObj.phone }
        ]
      },
      include: { assignedTo: true }
    });

    let lead: any;

    if (existingLead) {
      // 1. Update existing lead
      lead = await prisma.lead.update({
        where: { id: existingLead.id, tenantId: tenantIdStr },
        data: {
          location: dataObj.location || existingLead.location,
          eduBackground: dataObj.eduBackground || existingLead.eduBackground,
          qualification: dataObj.qualification || existingLead.qualification,
          interestedProgramId: dataObj.interestedProgramId || existingLead.interestedProgramId,
          additionalData: dataObj.additionalData ? {
            ...(existingLead.additionalData as any || {}),
            ...dataObj.additionalData
          } : undefined,
          stage: 'RESPONDED',
          updatedAt: new Date()
        }
      });

      // 4. Audit Log
      const AuditService = (await import('./audit.service')).default;
      await AuditService.log(tenantIdStr, `Existing lead re-applied: ${existingLead.name}`, undefined, { leadId: existingLead.id });
    } else {
      // If no existing lead, create a new one
      lead = await this.createLead(tenantIdStr, {
        ...dataObj,
        leadSource: dataObj.leadSource || 'Website'
      });
    }

    // Automatically create Application if interestedProgramId is present
    let applicationId = null;
    if (lead.interestedProgramId) {
      const existingApp = await prisma.application.findFirst({
        where: { leadId: lead.id }
      });
      if (existingApp) {
        applicationId = existingApp.id;
      } else {
        const newApp = await prisma.application.create({
          data: {
            tenantId: tenantIdStr,
            leadId: lead.id,
            programId: lead.interestedProgramId,
            status: 'STARTED'
          }
        });
        applicationId = newApp.id;

        // Log Application creation
        const AuditService = (await import('./audit.service')).default;
        await AuditService.log(tenantIdStr, `Automatic application created for lead: ${lead.name}`, undefined, { leadId: lead.id, applicationId });

        // Dispatch onboarding email with secure upload link for public application
        if (lead.email) {
          (async () => {
            try {
              const program = await prisma.program.findUnique({ where: { id: lead.interestedProgramId } });
              const tenant = await prisma.tenant.findUnique({ where: { id: tenantIdStr } });
              await CommunicationService.sendOnboardingEmail(tenantIdStr, lead, newApp, program, tenant);
            } catch (err) {
              console.error('[LeadService] Failed to send onboarding email for public app:', err);
            }
          })();
        }
      }
    }

    return { lead, applicationId };
  }

  async calculateLeadScore(tenantId: string, id: string) {
    const lead = await LeadRepository.findUnique(tenantId, id);
    if (!lead) return 0;

    let score = 0;
    if (lead.email) score += 20;
    if (lead.location) score += 10;
    if (lead.interestedProgramId) score += 20;
    if (['Google Ads', 'Website'].includes(lead.leadSource)) score += 30;

    return await LeadRepository.update(tenantId, id, { priority: score });
  }

  async getAllLeads(tenantId: string, filter: any, requestingUser?: any) {
    const { page = 1, limit = 10, stage, assignedId, sortBy, sortOrder, name, email } = filter;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { tenantId };
    if (stage) where.stage = stage;
    if (name) where.name = { contains: name, mode: 'insensitive' };
    if (email) where.email = { contains: email, mode: 'insensitive' };

    // --- ENFORCE DATA PRIVACY (RBAC) ---
    if (requestingUser) {
      const userRole = typeof requestingUser.role === 'string' ? requestingUser.role : requestingUser.role?.type;

      const isTeamMember = userRole === 'STANDARDUSER';

      if (isTeamMember) {
        where.assignedId = requestingUser.id;
      } else if (assignedId) {
        where.assignedId = assignedId;
      }
    } else if (assignedId) {
      where.assignedId = assignedId;
    }

    // Get total count for pagination
    const total = await LeadRepository.count(tenantId, where);

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const leads = await LeadRepository.findMany(tenantId, {
      skip,
      take,
      where,
      orderBy,
    });

    return {
      leads,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / take)
    };
  }

  async getLeadById(tenantId: string, id: string) {
    const lead = await LeadRepository.findUnique(tenantId, id);
    return lead;
  }

  async addNote(tenantId: string, id: string, content: string, type: any, assignedId: string) {
    return await prisma.leadNote.create({
      data: {
        leadId: id,
        tenantId,
        content,
        type: type || 'REMARK',
        assignedId
      },
      include: { assignedTo: { select: { name: true } } }
    });
  }

  async logInteraction(tenantId: string, leadId: string, data: { type: string, message: string, direction: string, assignedId: string, duration?: number, result?: string }) {
    return await prisma.communicationLog.create({
      data: {
        leadId,
        tenantId,
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

  async updateLead(tenantId: string, id: string, data: any, requestingUserId?: string) {
    const existingLead = await LeadRepository.findUnique(tenantId, id);
    if (!existingLead) throw new Error('Lead not found');

    // --- AUTOMATED HANDOVER LOGIC ---
    if (data.stage === 'MEETING SCHEDULED' && existingLead.stage !== 'MEETING SCHEDULED') {
      const { default: AssignmentService } = await import('./assignment.service');
      const assignedLead = await AssignmentService.assignToassignedTo(tenantId, id);

      if (assignedLead && assignedLead.assignedId) {
        await this.addNote(
          tenantId,
          id,
          `Handover: Lead moved to MEETING SCHEDULED. Automatically assigned to assignedTo: ${assignedLead.assignedTo?.name || 'Academic Team'}.`,
          'REMARK',
          requestingUserId || 'system'
        );

        NotificationDispatcher.enqueueFromTrigger({
          trigger: 'COUNSELING_SCHEDULED',
          eventTime: new Date(),
          tenantId,
          leadId: id,
          recipientId: assignedLead.assignedId,
          contactInfo: existingLead.phone || existingLead.email,
          payload: { 
            name: existingLead.name, 
            counselorName: assignedLead.assignedTo?.name || 'Academic Counselor' 
          },
        }).catch(() => { });
      }
    }


    const updatedLead = await LeadRepository.update(tenantId, id, data);

    // Trigger stage change notification if stage changed
    if (data.stage && data.stage !== existingLead.stage) {
      NotificationDispatcher.enqueueFromTrigger({
        trigger: 'LEAD_STAGE_CHANGED',
        eventTime: new Date(),
        tenantId,
        leadId: id,
        contactInfo: updatedLead.email || updatedLead.phone,
        payload: { name: updatedLead.name, stage: data.stage },
      }).catch(() => { });
    }

    if (data.stage === 'LOST_LEAD') {
      NotificationDispatcher.enqueueFromTrigger({
        trigger: 'LEAD_LOST',
        eventTime: new Date(),
        tenantId,
        leadId: id,
        contactInfo: updatedLead.email || updatedLead.phone,
        payload: { name: updatedLead.name, reason: data.statusNote || 'No reason provided' },
      }).catch(() => { });

      // A2: Notify Admins when lead is LOST
      const adminUsers = await prisma.user.findMany({ 
        where: { tenantId, role: { type: 'ADMIN' } } 
      });
      for (const admin of adminUsers) {
        NotificationDispatcher.enqueueFromTrigger({
          trigger: 'LEAD_LOST',
          eventTime: new Date(),
          tenantId,
          leadId: id,
          recipientId: admin.id,
          payload: { leadName: updatedLead.name, reason: data.statusNote || 'No reason provided' },
        }).catch(() => { });
      }
    }

    if (data.assignedId && data.assignedId !== existingLead.assignedId) {
      NotificationDispatcher.enqueueFromTrigger({
        trigger: 'LEAD_ASSIGNED',
        eventTime: new Date(),
        tenantId,
        leadId: id,
        recipientId: data.assignedId,
        payload: { name: updatedLead.name, leadId: id, source: updatedLead.leadSource },
      }).catch(() => { });
    }

    return updatedLead;
  }

  async deleteLead(tenantId: string, id: string) {
    const AuditService = (await import('./audit.service')).default;
    const lead = await LeadRepository.findUnique(tenantId, id);
    if (lead) {
      await AuditService.log(tenantId, `Lead deleted: ${lead.name}`, undefined, { leadId: id });
    }
    return await LeadRepository.delete(tenantId, id);
  }

  async assignLead(tenantId: string, id: string, assignedId: string) {
    const updated = await LeadRepository.update(tenantId, id, {
      assignedTo: { connect: { id: assignedId } }
    });

    // ── Notification Trigger: manual assignment ───────────────────────────
    NotificationDispatcher.enqueueFromTrigger({
      trigger: 'LEAD_ASSIGNED',
      eventTime: new Date(),
      tenantId,
      leadId: id,
      recipientId: assignedId,
      payload: { name: updated.name, leadId: id, source: updated.leadSource },
    }).catch(() => { });

    return updated;
  }


  async getLeadStats(tenantId: string, userId?: string, role?: any) {
    const roleType = typeof role === 'object' && role !== null ? role.type : role;
    const isTeamMember = roleType === 'STANDARDUSER';
    const filter = isTeamMember && userId ? { assignedId: userId, tenantId } : { tenantId };

    const totalLeads = await LeadRepository.count(tenantId, filter);

    const today = new Date(new Date().setHours(0, 0, 0, 0));

    const leadsToday = await LeadRepository.count(tenantId, {
      ...filter,
      createdAt: { gte: today }
    });

    const newLeads = await LeadRepository.count(tenantId, {
      ...filter,
      createdAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
      },
    });

    const admissions = await LeadRepository.count(tenantId, {
      ...filter,
      stage: 'ADMISSION'
    });

    // Calculate real revenue from successful payments for this tenant
    const revenueAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS', tenantId }
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

  async reactivateLead(tenantId: string, id: string, userId: string) {
    const lead = await LeadRepository.findUnique(tenantId, id);
    if (!lead) throw new Error('Lead not found');

    if (lead.stage !== 'RE-ENGAGEMENT' && lead.stage !== 'LOST') {
      throw new Error('Only RE-ENGAGEMENT or LOST leads can be reactivated');
    }

    // 1. Update lead stage
    const updatedLead = await LeadRepository.update(tenantId, id, { stage: 'NEW' });

    // 2. Add a system note
    await this.addNote(tenantId, id, 'Lead reactivated from Re-engagement stage.', 'REMARK', userId);

    // 3. Create a follow-up task for the assignedTo
    if (updatedLead.assignedId) {
      await prisma.followUp.create({
        data: {
          leadId: id,
          tenantId,
          assignedId: updatedLead.assignedId,
          notes: 'Welcome back follow-up: Student accepted re-engagement offer.',
          scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // +2 hours (asap)
        }
      });
    }

    // 4. Audit Log
    const AuditService = (await import('./audit.service')).default;
    await AuditService.log(tenantId, `Lead reactivated: ${lead.name}`, userId, { leadId: id });

    return updatedLead;
  }
}

export default new LeadService();
