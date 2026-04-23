import prisma from '../config/prisma';
import { emitToUser } from '../src/config/socket';

class NotificationService {
  async create(data: {
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
        isRead: false
      }
    });

    // PUSH via WebSocket
    emitToUser(data.userId, 'new-notification', notification);

    return notification;
  }

  async getByUser(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  async delete(id: string) {
    return prisma.notification.delete({
      where: { id }
    });
  }

  async clearAll(userId: string) {
    return prisma.notification.deleteMany({
      where: { userId }
    });
  }
}

export default new NotificationService();
