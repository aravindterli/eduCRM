import { Request, Response } from 'express';
import NotificationService from '../services/notification.service';

export class NotificationController {
  static async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const notifications = await NotificationService.getByUser(userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async markRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await NotificationService.markAsRead(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async markAllRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      await NotificationService.markAllRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async clearAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      await NotificationService.clearAll(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await NotificationService.delete(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
