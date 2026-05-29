import prisma from '../config/prisma';
import { emitToUser } from '../src/config/socket';

class NotificationService {
  async create(tenantId: string, data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    taskId?: string;
    leadId?: string;
    scheduledAt?: Date;
  }) {
    const notification = await prisma.notification.create({
      data: {
        ...data,
        tenantId,
        isRead: false
      }
    });

    // PUSH via WebSocket
    emitToUser(data.userId, 'new-notification', notification);

    return notification;
  }

  async getByUser(tenantId: string, userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async markAsRead(tenantId: string, id: string) {
    return prisma.notification.update({
      where: { id, tenantId },
      data: { isRead: true }
    });
  }

  async markAllRead(tenantId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { userId, tenantId, isRead: false },
      data: { isRead: true }
    });
  }

  async delete(tenantId: string, id: string) {
    return prisma.notification.delete({
      where: { id, tenantId }
    });
  }

  async clearAll(tenantId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { userId, tenantId }
    });
  }
}

export default new NotificationService();
