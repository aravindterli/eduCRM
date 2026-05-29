import prisma from '../config/prisma';

export class AuditService {
  async log(tenantId: string, action: string, userId?: string, details?: any) {
    try {
      return await prisma.auditLog.create({
        data: {
          tenantId,
          action,
          userId,
          details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  async getRecentLogs(tenantId: string, limit = 10) {
    return await prisma.auditLog.findMany({
      where: { tenantId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default new AuditService();
