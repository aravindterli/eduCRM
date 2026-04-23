import prisma from '../config/prisma';
import DocumentGeneratorService from './documentGenerator.service';
import CommunicationService from './communication.service';

export class ApplicationService {
  async createApplication(data: any) {
    const application = await prisma.application.create({
      data: {
        leadId: data.leadId,
        programId: data.programId,
        status: 'STARTED',
      },
    });

    await prisma.lead.update({
      where: { id: data.leadId },
      data: { stage: 'APPLICATION_STARTED' },
    });

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
        data: { stage: 'APPLICATION_SUBMITTED' },
      });
    }

    if (status === 'REJECTED') {
      const lead = await prisma.lead.update({
        where: { id: application.leadId },
        data: { stage: 'RE_ENGAGEMENT' },
      });

      // Auto-schedule Re-engagement Follow-up (30 days from now)
      if (lead.assignedId) {
        await prisma.followUp.create({
          data: {
            leadId: lead.id,
            assignedId: lead.assignedId,
            notes: `Automated re-engagement after application rejection. Reason: ${reason || 'N/A'}`,
            scheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
          }
        });
      }

      // Audit Log
      await prisma.auditLog.create({
        data: {
          action: 'APPLICATION_REJECTED',
          details: { applicationId: id, leadId: application.leadId, reason: reason || 'No reason provided', timestamp: new Date() }
        }
      });

      // Notify student
      await CommunicationService.sendRejectionNotification(lead, reason || 'Incomplete documentation');
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
      }
    });

    await prisma.lead.update({
      where: { id: application.leadId },
      data: { stage: 'ADMISSION_CONFIRMED' },
    });

    // Notify Student
    await CommunicationService.sendAdmissionConfirmation(application.lead, admission);

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
}

export default new ApplicationService();
