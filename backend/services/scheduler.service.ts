import cron from 'node-cron';
import prisma from '../config/prisma';
import CommunicationService from './communication.service';
import BackupService from './backup.service';
import NotificationService from './notification.service';
import { LeadStage } from '@prisma/client';

export class SchedulerService {
  startAllJobs() {
    console.log('[Scheduler] Starting automated cron jobs...');
    this.scheduleDailyReminders();
    this.scheduleDripCampaigns();
    this.scheduleReEngagementDrip();
    this.scheduleAutomatedBackups();
    this.scheduleMetaLeadRetrieval();
    this.schedule10MinAlerts();
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
          stage: LeadStage.NEW_LEAD,
          createdAt: { lt: twoDaysAgo }
        }
      });

      for (const lead of staleLeads) {
        // Send a drip WhatsApp/SMS to try and re-engage
        if (lead.phone) {
          await CommunicationService.sendWhatsApp(
            lead.phone, // In a real app, decrypt it first if it's currently encrypted exactly like email/phone
            `Hi ${lead.name}, we noticed you haven't moved forward with your inquiry. Let us know if you need help!`,
            lead.id
          );
        }
      }
    });
  }

  private scheduleAutomatedBackups() {
    // Runs every day at 3:00 AM
    cron.schedule('0 3 * * *', async () => {
      console.log('[Scheduler] Running Automated Database Backup');
      await BackupService.performBackup();
    });
  }

  private scheduleReEngagementDrip() {
    // Runs every day at 11:00 AM
    cron.schedule('39 16 * * *', async () => {
      console.log('[Scheduler] Running Automated Re-engagement Reach-out');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find leads in RE_ENGAGEMENT stage that have a follow-up scheduled for today
      const reEngagementLeads = await prisma.lead.findMany({
        where: {
          stage: LeadStage.RE_ENGAGEMENT,
          followUps: {
            some: {
              scheduledAt: { gte: today, lt: tomorrow },
              completedAt: null,
              notes: { contains: 'Automated re-engagement' }
            }
          }
        },
        include: { program: true }
      });

      for (const lead of reEngagementLeads) {
        await CommunicationService.sendReEngagementMessage(lead);
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
}

export default new SchedulerService();
