import prisma from '../config/prisma';

export class AuditService {
  async log(action: string, userId?: string, details?: any) {
    try {
      return await prisma.auditLog.create({
        data: {
          action,
          userId,
          details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  async getRecentLogs(limit = 10) {
    return await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default new AuditService();
