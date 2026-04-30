import cron from 'node-cron';
import prisma from '../config/prisma';
import CommunicationService from './communication.service';
import BackupService from './backup.service';
import NotificationService from './notification.service';
import NotificationDispatcherService from './notificationDispatcher.service';
import { LeadStage } from '@prisma/client';


export class SchedulerService {
  startAllJobs() {
    console.log('[Scheduler] Starting automated cron jobs...');
    this.scheduleNotificationDispatcher(); // every minute — must be first
    this.scheduleDailyReminders();
    this.scheduleDripCampaigns();
    this.scheduleReEngagementDrip();
    this.scheduleAutomatedBackups();
    this.scheduleMetaLeadRetrieval();
    this.schedule10MinAlerts();
    this.scheduleQueueCleanup();
    this.scheduleOverdueFollowUpAlerts(); // T4
    this.scheduleFeeDueReminders();       // F2 / L11
    this.scheduleDailySummaries();        // T6 / C6
    this.scheduleWeeklyFinanceReport();   // F5
  }

  private scheduleDailyReminders() {
    // Runs every day at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
      console.log('[Scheduler] Running Daily Follow-up Reminders Job');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const pendingFollowUps = await prisma.followUp.findMany({
        where: {
          scheduledAt: { gte: today, lt: tomorrow },
          completedAt: null
        },
        include: { assignedTo: true, lead: true }
      });

      for (const followup of pendingFollowUps) {
        if (followup.assignedTo.email) {
          await CommunicationService.sendEmail(
            followup.assignedTo.email,
            'daily_reminder',
            { name: followup.assignedTo.name, leadName: followup.lead.name }
          );
        }
      }
    });
  }

  private scheduleDripCampaigns() {
    // Runs every day at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
      console.log('[Scheduler] Running Drip Campaign Job for Stale Leads');

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const staleLeads = await prisma.lead.findMany({
        where: {
          stage: 'NEW_LEAD',
          updatedAt: { lt: twoDaysAgo }
        }
      });

      for (const lead of staleLeads) {
        await NotificationDispatcherService.enqueueFromTrigger({
          trigger: 'RE_ENGAGEMENT_DRIP',
          eventTime: new Date(),
          leadId: lead.id,
          contactInfo: lead.email || lead.phone,
          payload: { name: lead.name }
        });
      }
    });
  }


  private scheduleAutomatedBackups() {
    // Runs every day at 3:00 AM
    cron.schedule('0 3 * * *', async () => {
      console.log('[Scheduler] Running Automated Database Backup');
      await BackupService.performBackup();

      // A4: Notify Admin on backup complete
      const adminUsers = await prisma.user.findMany({ where: { role: { type: 'ADMIN' } } });
      for (const admin of adminUsers) {
        await NotificationDispatcherService.scheduleOne({
          trigger: 'SYSTEM_BACKUP',
          channel: 'INTERNAL',
          recipientId: admin.id,
          subject: '💾 System Backup Complete',
          body: 'The daily database backup has been successfully completed at 3:00 AM.',
          scheduledAt: new Date(),
        });
      }
    });
  }


  private scheduleReEngagementDrip() {
    // Runs every day at 11:00 AM
    cron.schedule('0 11 * * *', async () => {
      console.log('[Scheduler] Running Automated Re-engagement Reach-out');

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const veryStaleLeads = await prisma.lead.findMany({
        where: {
          stage: { in: ['LOST_LEAD', 'RE_ENGAGEMENT'] },
          updatedAt: { lt: sevenDaysAgo }
        }
      });

      for (const lead of veryStaleLeads) {
        await NotificationDispatcherService.enqueueFromTrigger({
          trigger: 'RE_ENGAGEMENT_DRIP',
          eventTime: new Date(),
          leadId: lead.id,
          contactInfo: lead.email || lead.phone,
          payload: { name: lead.name, isSecondAttempt: true }
        });
      }
    });
  }

  private scheduleMetaLeadRetrieval() {
    // Runs every 3 hours
    cron.schedule('0 */3 * * *', async () => {
      console.log('[Scheduler] Running Periodical Meta Lead Sync');
      const { default: MetaService } = await import('./meta.service');
      await MetaService.syncRecentLeads();
    });
  }

  private schedule10MinAlerts() {
    // Runs every minute
    cron.schedule('* * * * *', async () => {
      const now = new Date();
      const tenMinsFromNow = new Date(now.getTime() + 10 * 60000);
      const elevenMinsFromNow = new Date(now.getTime() + 11 * 60000);

      const upcomingTasks = await prisma.followUp.findMany({
        where: {
          scheduledAt: {
            gte: tenMinsFromNow,
            lt: elevenMinsFromNow
          },
          completedAt: null
        },
        include: { lead: true }
      });

      for (const task of upcomingTasks) {
        await NotificationService.create({
          userId: task.assignedId,
          title: `Upcoming Call: ${task.lead?.name || 'Lead'}`,
          message: `Call scheduled in 10 minutes at ${task.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          type: 'FOLLOW_UP',
          taskId: task.id,
          leadId: task.leadId,
          scheduledAt: task.scheduledAt
        });
      }
    });
  }
  // ─── NOTIFICATION DISPATCHER — every minute ────────────────────────────
  private scheduleNotificationDispatcher() {
    cron.schedule('* * * * *', async () => {
      try {
        await NotificationDispatcherService.dispatchDue();
      } catch (err: any) {
        console.error('[Scheduler] Dispatcher error:', err.message);
      }
    });
    console.log('[Scheduler] ✅ Notification dispatcher running (every minute)');
  }

  // ─── QUEUE CLEANUP — daily at 4 AM ────────────────────────────────────
  private scheduleQueueCleanup() {
    cron.schedule('0 4 * * *', async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60_000);
      const { count } = await (prisma as any).scheduledNotification.deleteMany({
        where: {
          status: { in: ['SENT', 'FAILED', 'CANCELLED'] },
          createdAt: { lt: thirtyDaysAgo },
        },
      });

      console.log(`[Scheduler] 🧹 Cleaned up ${count} old notification queue entries`);
    });
  }

  // ─── T4: OVERDUE FOLLOW-UP ALERTS — every 30 minutes ─────────────────────
  private scheduleOverdueFollowUpAlerts() {
    cron.schedule('*/30 * * * *', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60_000);
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60_000);

      const overdueFollowUps = await prisma.followUp.findMany({
        where: {
          scheduledAt: { gte: twoHoursAgo, lt: oneHourAgo },
          completedAt: null,
        },
        include: { assignedTo: true, lead: true },
      });

      for (const fu of overdueFollowUps) {
        await NotificationDispatcherService.scheduleOne({
          trigger: 'FOLLOW_UP_OVERDUE',
          channel: 'INTERNAL',
          recipientId: fu.assignedId,
          subject: `⏰ Overdue: ${fu.lead?.name || 'Lead'}`,
          body: `Your follow-up with ${fu.lead?.name || 'a lead'} was scheduled for ${fu.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} and has not been marked complete.`,
          payload: { name: fu.assignedTo.name, leadName: fu.lead?.name || 'Lead' },
          scheduledAt: new Date(),
          leadId: fu.leadId,
        });
      }
    });
  }

  // ─── F2 / L11: FEE DUE REMINDERS — daily at 9 AM ──────────────────────
  private scheduleFeeDueReminders() {
    cron.schedule('0 9 * * *', async () => {
      console.log('[Scheduler] Running Fee Due Reminder Job');
      const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60_000);
      const in4Days = new Date(Date.now() + 4 * 24 * 60 * 60_000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60_000);
      const dayAfterTomorrow = new Date(Date.now() + 2 * 24 * 60 * 60_000);
      const today = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // 3-day advance warning
      const fees3Day = await prisma.fee.findMany({
        where: { dueDate: { gte: in3Days, lt: in4Days }, status: { not: 'COMPLETED' } },
        include: { admission: { include: { application: { include: { lead: true } } } } },
      });
      // 1-day advance warning
      const fees1Day = await prisma.fee.findMany({
        where: { dueDate: { gte: tomorrow, lt: dayAfterTomorrow }, status: { not: 'COMPLETED' } },
        include: { admission: { include: { application: { include: { lead: true } } } } },
      });
      // Due today
      const feesOverdue = await prisma.fee.findMany({
        where: { dueDate: { gte: today, lt: endOfDay }, status: { not: 'COMPLETED' } },
        include: { admission: { include: { application: { include: { lead: true } } } } },
      });

      const allFees = [
        ...fees3Day.map(f => ({ ...f, label: '3 days' })),
        ...fees1Day.map(f => ({ ...f, label: '1 day' })),
        ...feesOverdue.map(f => ({ ...f, label: 'today' })),
      ];

      for (const fee of allFees) {
        const lead = fee.admission?.application?.lead;
        if (!lead) continue;
        await NotificationDispatcherService.enqueueFromTrigger({
          trigger: 'FEE_DUE_REMINDER',
          eventTime: new Date(),
          leadId: lead.id,
          contactInfo: lead.email || lead.phone,
          payload: { name: lead.name, amount: fee.amount, dueIn: (fee as any).label },
        });
      }
    });
  }

  // ─── T6 / C6: DAILY SUMMARY — every day 8 AM ──────────────────────────
  private scheduleDailySummaries() {
    cron.schedule('0 8 * * *', async () => {
      console.log('[Scheduler] Running Daily Summary Job');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const pendingTasks = await prisma.followUp.findMany({
        where: { scheduledAt: { gte: today, lt: tomorrow }, completedAt: null },
        include: { assignedTo: { include: { role: true } } },
      });

      // Group by user
      const byUser: Record<string, { user: any; count: number }> = {};
      for (const task of pendingTasks) {
        if (!byUser[task.assignedId]) byUser[task.assignedId] = { user: task.assignedTo, count: 0 };
        byUser[task.assignedId].count++;
      }

      for (const entry of Object.values(byUser)) {
        if (!entry.user.email) continue;
        
        const roleType = entry.user.role?.type;
        const trigger = roleType === 'COUNSELOR' ? 'DAILY_SUMMARY_COUNSELOR' : 'DAILY_SUMMARY_TELECALLER';

        await NotificationDispatcherService.enqueueFromTrigger({
          trigger,
          eventTime: new Date(),
          recipientId: entry.user.id,
          contactInfo: entry.user.email,
          payload: { name: entry.user.name, count: entry.count, date: today.toLocaleDateString() },
        });
      }
    });
  }


  // ─── F5: WEEKLY FINANCE REPORT — every Monday 9 AM ─────────────────────
  private scheduleWeeklyFinanceReport() {
    cron.schedule('0 9 * * 1', async () => {
      console.log('[Scheduler] Running Weekly Finance Report Job');
      const financeUsers = await prisma.user.findMany({
        where: { role: { type: 'FINANCE' } },
        include: { role: true },
      });
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60_000);
      const collected = await prisma.payment.aggregate({
        where: { status: 'SUCCESS', createdAt: { gte: weekAgo } },
        _sum: { amount: true },
      });
      const amount = collected._sum.amount || 0;

      for (const user of financeUsers) {
        if (!user.email) continue;
        await NotificationDispatcherService.enqueueFromTrigger({
          trigger: 'WEEKLY_FINANCE_REPORT',
          eventTime: new Date(),
          recipientId: user.id,
          contactInfo: user.email,
          payload: { name: user.name, amount, week: new Date().toLocaleDateString('en-IN') },
        });
      }
    });
  }
}

export default new SchedulerService();
