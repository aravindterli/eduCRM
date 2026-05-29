import prisma from '../config/prisma';
import DocumentGeneratorService from './documentGenerator.service';
import CommunicationService from './communication.service';
import NotificationDispatcher from './notificationDispatcher.service';

export class ApplicationService {
  async createApplication(data: any) {
    // Check if an application already exists for this lead
    const existing = await prisma.application.findUnique({
      where: { leadId: data.leadId }
    });

    if (existing) {
      let application = existing;
      const programChanged = existing.programId !== data.programId;

      if (programChanged) {
        application = await prisma.application.update({
          where: { id: existing.id },
          data: {
            program: { connect: { id: data.programId } }
          }
        });
      }

      // Ensure stage is updated
      await prisma.lead.update({
        where: { id: data.leadId },
        data: { stage: 'NEGOTIATION' },
      });

      if (programChanged) {
        const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
        if (lead && lead.email) {
          (async () => {
            try {
              const program = await prisma.program.findUnique({ where: { id: data.programId } });
              const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId } });
              await CommunicationService.sendOnboardingEmail(data.tenantId, lead, application, program, tenant);
            } catch (err) {
              console.error('[ApplicationService] Failed to re-send onboarding email:', err);
            }
          })();
        }
      }

      return application;
    }

    const application = await prisma.application.create({
      data: {
        status: 'STARTED',
        lead: { connect: { id: data.leadId } },
        program: { connect: { id: data.programId } },
        tenant: { connect: { id: data.tenantId } }
      },
    });

    await prisma.lead.update({
      where: { id: data.leadId },
      data: { stage: 'NEGOTIATION' },
    });

    // L7: Notify lead to complete application
    const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
    if (lead) {
      NotificationDispatcher.enqueueFromTrigger({
        trigger: 'APPLICATION_STARTED',
        eventTime: new Date(),
        leadId: lead.id,
        contactInfo: lead.email || lead.phone,
        payload: { name: lead.name },
      }).catch(() => {});

      // Dispatch onboarding email with secure upload link
      if (lead.email) {
        (async () => {
          try {
            const program = await prisma.program.findUnique({ where: { id: data.programId } });
            const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId } });
            await CommunicationService.sendOnboardingEmail(data.tenantId, lead, application, program, tenant);
          } catch (err) {
            console.error('[ApplicationService] Failed to send onboarding email:', err);
          }
        })();
      }
    }

    return application;
  }

  async uploadDocument(applicationId: string, docData: any) {
    return await prisma.document.create({
      data: {
        applicationId,
        type: docData.type,
        url: docData.url,
      },
    });
  }

  async updateStatus(id: string, status: any, reason?: string) {
    const application = await prisma.application.update({
      where: { id },
      data: { 
        status,
        submittedAt: status === 'SUBMITTED' ? new Date() : undefined
      },
    });

    if (status === 'SUBMITTED') {
      await prisma.lead.update({
        where: { id: application.leadId },
        data: { stage: 'NEGOTIATION' },
      });
      // L8: Notify lead — application received
      const lead = await prisma.lead.findUnique({ where: { id: application.leadId } });
      if (lead) {
        NotificationDispatcher.enqueueFromTrigger({
          trigger: 'APPLICATION_SUBMITTED',
          eventTime: new Date(),
          leadId: lead.id,
          contactInfo: lead.email || lead.phone,
          payload: { name: lead.name },
        }).catch(() => {});
      }
    }

    if (status === 'REJECTED') {
      const lead = await prisma.lead.update({
        where: { id: application.leadId },
        data: { stage: 'RE-ENGAGEMENT' },
      });

      if (lead.assignedId) {
        await prisma.followUp.create({
          data: {
            leadId: lead.id,
            assignedId: lead.assignedId,
            notes: `Automated re-engagement after application rejection. Reason: ${reason || 'N/A'}`,
            scheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }
        });
      }

      await prisma.auditLog.create({
        data: {
          action: 'APPLICATION_REJECTED',
          details: { applicationId: id, leadId: application.leadId, reason: reason || 'No reason provided', timestamp: new Date() }
        }
      });

      // Dispatcher trigger handles professional notification to lead
      NotificationDispatcher.enqueueFromTrigger({
        trigger: 'APPLICATION_REJECTED',
        eventTime: new Date(),
        leadId: lead.id,
        contactInfo: lead.email || lead.phone,
        payload: { name: lead.name, reason: reason || 'Incomplete documentation' },
      }).catch(() => {});
    }

    if (status === 'VERIFIED') {
      const lead = await prisma.lead.findUnique({ where: { id: application.leadId } });
      if (lead) {
        NotificationDispatcher.enqueueFromTrigger({
          trigger: 'APPLICATION_VERIFIED',
          eventTime: new Date(),
          leadId: lead.id,
          contactInfo: lead.email || lead.phone,
          payload: { name: lead.name },
        }).catch(() => {});
      }
    }


    return application;
  }

  async getAllApplications() {
    return await prisma.application.findMany({
      include: {
        lead: true,
        program: true,
        documents: true,
        admission: true,
      },
    });
  }

  async evaluateEligibility(applicationId: string) {
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { documents: true }
    });

    if (!app) return false;

    // Logic: Must have at least 2 documents uploaded
    const isEligible = app.documents.length >= 2;
    
    return {
      eligible: isEligible,
      reason: isEligible ? 'Sufficient documents provided' : 'Missing required certificates',
    };
  }

  async confirmAdmission(applicationId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { lead: true }
    });

    if (!application) throw new Error('Application not found');

    // Check if already admitted
    const existingAdmission = await prisma.admission.findUnique({
      where: { applicationId }
    });
    if (existingAdmission) return existingAdmission;

    const enrollmentId = `EDU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const admission = await prisma.admission.create({
      data: {
        applicationId: application.id,
        enrollmentId,
        programId: application.programId,
        tenantId: application.tenantId,
      },
      include: {
        program: true
      }
    });

    // Create Initial Fee Record
    await prisma.fee.create({
      data: {
        admissionId: admission.id,
        amount: admission.program.baseFee || 5000, // Fallback if not set
        status: 'PENDING',
        tenantId: application.tenantId,
      }
    });

    await prisma.lead.update({
      where: { id: application.leadId },
      data: { stage: 'CONVERTED' },
    });

    // Dispatcher trigger handles professional notification to student
    NotificationDispatcher.enqueueFromTrigger({
      trigger: 'ADMISSION_CONFIRMED',
      eventTime: new Date(),
      leadId: application.leadId,
      contactInfo: application.lead.email || application.lead.phone,
      payload: { name: application.lead.name, enrollmentId, programName: admission.program.name },
    }).catch(() => {});

    // F1: Notify Finance team (In-App alert)
    const financeUsers = await prisma.user.findMany({
      where: { role: { type: 'FINANCE' } }
    });

    for (const user of financeUsers) {
      NotificationDispatcher.enqueueFromTrigger({
        trigger: 'ADMISSION_CONFIRMED',
        eventTime: new Date(),
        leadId: application.leadId,
        recipientId: user.id,
        payload: { leadName: application.lead.name, enrollmentId, programName: admission.program.name },
      }).catch(() => {});
    }

    // A3: Notify Admin team (In-App alert)
    const adminUsers = await prisma.user.findMany({
      where: { role: { type: 'ADMIN' } }
    });

    for (const user of adminUsers) {
      NotificationDispatcher.enqueueFromTrigger({
        trigger: 'ADMISSION_CONFIRMED',
        eventTime: new Date(),
        leadId: application.leadId,
        recipientId: user.id,
        payload: { leadName: application.lead.name, enrollmentId, programName: admission.program.name },
      }).catch(() => {});
    }

    return admission;

  }

  async getAdmissionLetter(applicationId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { 
        lead: true, 
        program: true,
        admission: true 
      }
    });

    if (!application || !application.admission) {
      throw new Error('Admission not found for this application');
    }

    const pdfUrl = await DocumentGeneratorService.generateAdmissionLetter({
      studentName: application.lead.name,
      programName: application.program.name,
      enrollmentId: application.admission.enrollmentId
    });

    return { url: pdfUrl };
  }

  async getPublicApplicationDetails(applicationId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        lead: {
          select: {
            name: true,
            email: true,
            phone: true,
            location: true,
          }
        },
        program: {
          select: {
            name: true,
            description: true,
            baseFee: true,
          }
        },
        tenant: {
          select: {
            name: true,
            sector: true,
          }
        },
        documents: {
          select: {
            id: true,
            type: true,
            name: true,
            status: true,
          }
        }
      }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    return application;
  }
}

export default new ApplicationService();
