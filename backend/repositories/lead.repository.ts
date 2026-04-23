import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';

export class LeadRepository {
  async create(data: Prisma.LeadCreateInput) {
    return await prisma.lead.create({ data });
  }

  async findMany(options: { 
    skip?: number; 
    take?: number; 
    where?: Prisma.LeadWhereInput; 
    orderBy?: Prisma.LeadOrderByWithRelationInput;
  }) {
    return await prisma.lead.findMany({
      ...options,
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

  async findUnique(id: string) {
    return await prisma.lead.findUnique({
      where: { id },
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

  async update(id: string, data: Prisma.LeadUpdateInput) {
    return await prisma.lead.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return await prisma.lead.delete({ where: { id } });
  }

  async count(where?: Prisma.LeadWhereInput) {
    return await prisma.lead.count({ where });
  }
}

export default new LeadRepository();
