import { Request, Response } from 'express';
import prisma from '../config/prisma';

const db = prisma as any; // cast until Prisma client fully regenerates with new models

export class NotificationRuleController {
  // ─── RULE CRUD ─────────────────────────────────────────────────────────────

  async getRules(req: Request, res: Response) {
    try {
      const rules = await db.notificationRule.findMany({
        orderBy: { createdAt: 'desc' },
        include: { template: { select: { id: true, name: true, channel: true } } },
      });
      res.json(rules);
    } catch (err: any) {
      console.error('[NotifRule] getRules:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async createRule(req: Request, res: Response) {
    try {
      const { name, description, trigger, channel, templateId, offsets, isActive } = req.body;
      if (!name || !trigger || !channel || !offsets?.length) {
        return res.status(400).json({ error: 'name, trigger, channel, and offsets are required' });
      }
      const rule = await db.notificationRule.create({
        data: { name, description, trigger, channel, templateId: templateId || null, offsets, isActive: isActive ?? true },
      });
      res.status(201).json(rule);
    } catch (err: any) {
      console.error('[NotifRule] createRule:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async updateRule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, trigger, channel, templateId, offsets, isActive } = req.body;
      const rule = await db.notificationRule.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(trigger && { trigger }),
          ...(channel && { channel }),
          ...(templateId !== undefined && { templateId: templateId || null }),
          ...(offsets && { offsets }),
          ...(isActive !== undefined && { isActive }),
          updatedAt: new Date(),
        },
      });
      res.json(rule);
    } catch (err: any) {
      console.error('[NotifRule] updateRule:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteRule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await db.notificationRule.delete({ where: { id } });
      res.json({ success: true });
    } catch (err: any) {
      console.error('[NotifRule] deleteRule:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async toggleRule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const existing = await db.notificationRule.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Rule not found' });
      const rule = await db.notificationRule.update({
        where: { id },
        data: { isActive: !existing.isActive, updatedAt: new Date() },
      });
      res.json(rule);
    } catch (err: any) {
      console.error('[NotifRule] toggleRule:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // ─── QUEUE ─────────────────────────────────────────────────────────────────

  async getQueue(req: Request, res: Response) {
    try {
      const { status, channel, limit = '100' } = req.query as any;
      const where: any = {};
      if (status) where.status = status;
      if (channel) where.channel = channel;

      const items = await db.scheduledNotification.findMany({
        where,
        orderBy: { scheduledAt: 'desc' },
        take: Math.min(parseInt(limit), 500),
      });
      res.json(items);
    } catch (err: any) {
      console.error('[NotifQueue] getQueue:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async scheduleOne(req: Request, res: Response) {
    try {
      const { trigger, channel, recipientId, contactInfo, subject, body, payload, scheduledAt, leadId } = req.body;
      if (!trigger || !channel || !scheduledAt) {
        return res.status(400).json({ error: 'trigger, channel, scheduledAt required' });
      }
      const item = await db.scheduledNotification.create({
        data: {
          trigger, channel,
          recipientId: recipientId || null,
          contactInfo: contactInfo || null,
          subject: subject || null,
          body: body || null,
          payload: payload || {},
          scheduledAt: new Date(scheduledAt),
          leadId: leadId || null,
          status: 'PENDING',
        },
      });
      res.status(201).json(item);
    } catch (err: any) {
      console.error('[NotifQueue] scheduleOne:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async cancelQueued(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const item = await db.scheduledNotification.update({
        where: { id },
        data: { status: 'CANCELLED', updatedAt: new Date() },
      });
      res.json(item);
    } catch (err: any) {
      console.error('[NotifQueue] cancelQueued:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async retryQueued(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const item = await db.scheduledNotification.update({
        where: { id },
        data: { status: 'PENDING', retryCount: 0, errorLog: null, updatedAt: new Date() },
      });
      res.json(item);
    } catch (err: any) {
      console.error('[NotifQueue] retryQueued:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
}

export default new NotificationRuleController();
