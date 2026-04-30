import prisma from '../config/prisma';
import CommunicationService from './communication.service';
import NotificationService from './notification.service';

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION DISPATCHER SERVICE
// Reads PENDING rows from ScheduledNotification, dispatches to correct channel,
// and marks them SENT or FAILED. Called every minute by the scheduler.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;

class NotificationDispatcherService {
  // ─── MAIN DISPATCHER (called by cron every minute) ────────────────────────
  async dispatchDue(): Promise<void> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 60_000); // next 1 minute window

    const pending = await (prisma as any).scheduledNotification.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lte: windowEnd },
        retryCount: { lt: MAX_RETRIES },
      },
      take: 100, // safety cap per run
    });

    if (pending.length === 0) return;
    console.log(`[Dispatcher] Processing ${pending.length} scheduled notification(s)...`);

    await Promise.allSettled(pending.map((n: any) => this.dispatch(n)));
  }

  // ─── SINGLE DISPATCH ──────────────────────────────────────────────────────
  private async dispatch(n: any): Promise<void> {
    // Optimistic lock: mark as processing to prevent double-dispatch
    const locked = await (prisma as any).scheduledNotification.updateMany({
      where: { id: n.id, status: 'PENDING' },
      data: { status: 'PROCESSING' },
    });

    if (locked.count === 0) return; // another process grabbed it

    try {
      const payload = (n.payload as Record<string, any>) || {};
      let result: { success: boolean; error?: string };

      switch (n.channel) {
        case 'EMAIL':
          result = await this.sendEmail(n, payload);
          break;
        case 'SMS':
          result = await this.sendSMS(n, payload);
          break;
        case 'RCS':
          result = await this.sendRCS(n, payload);
          break;
        case 'WHATSAPP':
          result = await this.sendWhatsApp(n, payload);
          break;
        case 'INTERNAL':
          result = await this.sendInternal(n, payload);
          break;
        default:
          result = { success: false, error: `Unknown channel: ${n.channel}` };
      }

      if (result.success) {
        await (prisma as any).scheduledNotification.update({
          where: { id: n.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        console.log(`[Dispatcher] ✅ ${n.channel} → ${n.contactInfo || n.recipientId} (${n.trigger})`);
      } else {
        throw new Error(result.error || 'Unknown dispatch error');
      }
    } catch (err: any) {
      const newRetryCount = (n.retryCount || 0) + 1;
      const isFinal = newRetryCount >= MAX_RETRIES;
      await (prisma as any).scheduledNotification.update({
        where: { id: n.id },
        data: {
          status: isFinal ? 'FAILED' : 'PENDING',
          retryCount: newRetryCount,
          errorLog: err.message,
        },
      });
      console.error(`[Dispatcher] ❌ ${n.channel} → ${n.contactInfo || n.recipientId}: ${err.message} (retry ${newRetryCount}/${MAX_RETRIES})`);
    }
  }

  // ─── CHANNEL SENDERS ──────────────────────────────────────────────────────

  private async sendEmail(n: any, payload: Record<string, any>) {
    const to = n.contactInfo;
    if (!to) return { success: false, error: 'No email address' };
    const templateKey = n.templateKey || n.templateId || 'generic';
    return CommunicationService.sendEmail(to, templateKey, payload, n.leadId ?? undefined);
  }

  private async sendSMS(n: any, payload: Record<string, any>) {
    const phone = n.contactInfo;
    if (!phone) return { success: false, error: 'No phone number' };
    const body = n.body || this.renderTemplate(payload.message || `Hi ${payload.name || 'there'}, you have a notification from CentraCRM.`, payload);
    return CommunicationService.sendSMS(phone, body, n.leadId ?? undefined);
  }

  private async sendRCS(n: any, payload: Record<string, any>) {
    const phone = n.contactInfo;
    if (!phone) return { success: false, error: 'No phone number' };
    const body = n.body || this.renderTemplate(payload.message || `Hi ${payload.name || 'there'}, you have a notification from CentraCRM.`, payload);
    return (CommunicationService as any).sendRCS(phone, body, n.leadId ?? undefined);
  }

  private async sendWhatsApp(n: any, payload: Record<string, any>) {
    const phone = n.contactInfo;
    if (!phone) return { success: false, error: 'No phone number' };
    const body = n.body || this.renderTemplate(payload.message || `Hi ${payload.name || 'there'}, you have a notification from CentraCRM.`, payload);
    return CommunicationService.sendWhatsApp(phone, body, n.leadId ?? undefined);
  }

  private async sendInternal(n: any, _payload: Record<string, any>) {
    const userId = n.recipientId;
    if (!userId) return { success: false, error: 'No recipientId for internal notification' };
    await NotificationService.create({
      userId,
      title: n.subject || 'Notification',
      message: n.body || 'You have a new notification.',
      type: n.trigger,
      leadId: n.leadId ?? undefined,
    });
    return { success: true };
  }

  // ─── TEMPLATE RENDERER ────────────────────────────────────────────────────
  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\$\{(\w+)\}/g, (_, key) => (data[key] !== undefined ? String(data[key]) : `[${key}]`));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RULE ENGINE — enqueue notifications based on active rules for a trigger
  // ─────────────────────────────────────────────────────────────────────────────
  async enqueueFromTrigger(opts: {
    trigger: string;
    eventTime: Date;
    leadId?: string;
    recipientId?: string;
    contactInfo?: string;
    payload?: Record<string, any>;
  }): Promise<void> {
    const { trigger, eventTime, leadId, recipientId, contactInfo, payload = {} } = opts;

    // Resolve user details if recipientId is present but contactInfo is missing
    let resolvedUser: any = null;
    if (recipientId && !contactInfo) {
      resolvedUser = await (prisma as any).user.findUnique({ where: { id: recipientId } });
    }

    const rules = await (prisma as any).notificationRule.findMany({
      where: { trigger, isActive: true },
      include: { template: true },
    });

    if (rules.length === 0) return;

    const rows: any[] = [];

    for (const rule of rules) {
      let resolvedContact = contactInfo;
      let resolvedRecipient = recipientId;

      // Auto-resolve contact for channel if we have the user
      if (!resolvedContact && resolvedUser) {
        if (rule.channel === 'EMAIL') resolvedContact = resolvedUser.email;
        else if (['SMS', 'RCS', 'WHATSAPP'].includes(rule.channel)) resolvedContact = resolvedUser.phone;
      }

      if (rule.channel === 'INTERNAL' && !resolvedRecipient) continue;
      if (['EMAIL', 'SMS', 'RCS', 'WHATSAPP'].includes(rule.channel) && !resolvedContact) continue;


      for (const offsetMinutes of rule.offsets) {
        const scheduledAt = new Date(eventTime.getTime() + offsetMinutes * 60_000);

        // Skip if already passed by more than 1 minute
        if (scheduledAt < new Date(Date.now() - 60_000)) continue;

        let body: string | undefined;
        let subject: string | undefined;

        if (rule.template) {
          body = this.renderTemplate(rule.template.content, payload);
          subject = rule.template.subject
            ? this.renderTemplate(rule.template.subject, payload)
            : undefined;
        }

        rows.push({
          ruleId: rule.id,
          trigger,
          channel: rule.channel,
          recipientId: resolvedRecipient ?? null,
          contactInfo: resolvedContact ?? null,
          templateId: rule.templateId ?? null,
          templateKey: rule.template?.name ?? null,
          subject: subject ?? null,
          body: body ?? null,
          payload,
          scheduledAt,
          leadId: leadId ?? null,
          status: 'PENDING',
        });
      }
    }

    if (rows.length > 0) {
      await (prisma as any).scheduledNotification.createMany({ data: rows });
      console.log(`[Dispatcher] 📬 Enqueued ${rows.length} notification(s) for trigger: ${trigger}`);
    }
  }

  // ─── MANUAL SCHEDULE ─────────────────────────────────────────────────────
  async scheduleOne(data: {
    trigger: string;
    channel: string;
    recipientId?: string;
    contactInfo?: string;
    templateId?: string;
    templateKey?: string;
    subject?: string;
    body?: string;
    payload?: Record<string, any>;
    scheduledAt: Date;
    leadId?: string;
  }): Promise<any> {
    return (prisma as any).scheduledNotification.create({
      data: {
        ...data,
        ruleId: null,
        status: 'PENDING',
        payload: data.payload ?? {},
      },
    });
  }
}

export default new NotificationDispatcherService();
