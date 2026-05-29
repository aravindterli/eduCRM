import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';

export class LeadRepository {
  async create(tenantId: string, data: Prisma.LeadCreateInput) {
    return await prisma.lead.create({
      data: {
        ...data,
        tenant: { connect: { id: tenantId } }
      }
    });
  }

  async findMany(tenantId: string, options: { 
    skip?: number; 
    take?: number; 
    where?: Prisma.LeadWhereInput; 
    orderBy?: Prisma.LeadOrderByWithRelationInput;
  }) {
    return await prisma.lead.findMany({
      ...options,
      where: {
        ...options.where,
        tenantId
      },
      include: {
        program: true,
        campaign: true,
        assignedTo: true,
        application: {
          include: { documents: true }
        },
        followUps: true,
        counselingLogs: true,
        communicationLogs: { orderBy: { timestamp: 'desc' } },
        notes: { orderBy: { createdAt: 'desc' }, include: { assignedTo: { select: { id: true, name: true } } } },
        webinarRegistrations: {
          include: {
            webinar: true
          }
        }
      },
    });
  }

  async findUnique(tenantId: string, id: string) {
    return await prisma.lead.findFirst({
      where: { id, tenantId },
      include: {
        program: true,
        campaign: true,
        assignedTo: true,
        followUps: true,
        counselingLogs: true,
        communicationLogs: { orderBy: { timestamp: 'desc' } },
        notes: { orderBy: { createdAt: 'desc' }, include: { assignedTo: { select: { id: true, name: true } } } },
        webinarRegistrations: {
          include: {
            webinar: true
          }
        },
        application: {
          include: { documents: true }
        }
      },
    });
  }

  async update(tenantId: string, id: string, data: Prisma.LeadUpdateInput) {
    return await prisma.lead.update({
      where: { id, tenantId },
      data,
    });
  }

  async delete(tenantId: string, id: string) {
    return await prisma.lead.delete({
      where: { id, tenantId }
    });
  }

  async count(tenantId: string, where?: Prisma.LeadWhereInput) {
    return await prisma.lead.count({
      where: {
        ...where,
        tenantId
      }
    });
  }
}

export default new LeadRepository();
