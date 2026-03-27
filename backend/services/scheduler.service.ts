import cron from 'node-cron';
import prisma from '../config/prisma';
import CommunicationService from './communication.service';
import BackupService from './backup.service';
import { LeadStage } from '@prisma/client';

export class SchedulerService {
  startAllJobs() {
    console.log('[Scheduler] Starting automated cron jobs...');
    this.scheduleDailyReminders();
    this.scheduleDripCampaigns();
    this.scheduleAutomatedBackups();
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
        include: { counselor: true, lead: true }
      });

      for (const followup of pendingFollowUps) {
        if (followup.counselor.email) {
          await CommunicationService.sendEmail(
            followup.counselor.email,
            'daily_reminder',
            { name: followup.counselor.name, leadName: followup.lead.name }
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
}

export default new SchedulerService();
