const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding COMPREHENSIVE Notification Templates (Internal + External)...');

  const templates = [
    // --- 1. LEAD NOTIFICATIONS (EXTERNAL) ---
    {
      name: 'Welcome Email (Lead Created)',
      channel: 'EMAIL',
      subject: '👋 Welcome to CentraCRM - Your Journey Starts Here!',
      content: 'Hi ${name},\n\nThank you for your interest in our programs! We have received your inquiry from ${leadSource}.\n\nA dedicated counselor will be reaching out to you shortly to guide you through the next steps.\n\nBest Regards,\nAdmissions Team'
    },
    {
      name: 'Welcome WhatsApp (Lead Created)',
      channel: 'WHATSAPP',
      content: 'Hi ${name}! 👋 Welcome to CentraCRM. We have received your inquiry for our programs. A counselor will call you shortly to assist you. Stay tuned!'
    },
    {
      name: 'Lead Assignment Notification',
      channel: 'WHATSAPP',
      content: 'Hi ${name}, our expert counselor ${staffName} has been assigned to help you with your application. Expect a call shortly!'
    },
    {
      name: 'Call Reminder (Lead)',
      channel: 'WHATSAPP',
      content: 'Reminder: You have a scheduled call with your counselor ${staffName} at ${scheduledAt}. Talk soon!'
    },
    {
      name: 'Counseling Invite',
      channel: 'EMAIL',
      subject: '📅 Invitation: Counseling Session',
      content: 'Hi ${name},\n\nYou have a counseling session scheduled with ${counselorName} at ${scheduledAt}.\n\nPlease join using this link: ${meetingUrl}\n\nSee you there!'
    },
    {
      name: 'Webinar Confirmation',
      channel: 'EMAIL',
      subject: '🎓 Webinar Registration Confirmed: ${webinarTitle}',
      content: 'Hi ${name},\n\nYou are successfully registered for the webinar: ${webinarTitle}.\n\nDate: ${webinarDate}\nTime: ${webinarTime}\n\nJoin Link: ${meetingUrl}'
    },
    {
      name: 'Webinar Reminder',
      channel: 'WHATSAPP',
      content: 'Hi ${name}, the webinar "${webinarTitle}" is starting soon at ${webinarTime}! Click here to join: ${meetingUrl}'
    },
    {
      name: 'Application Update',
      channel: 'EMAIL',
      subject: '✨ Update: Your Application Status',
      content: 'Hi ${name},\n\nYour application status has been updated. Log in to your portal to see the latest progress.\n\nBest Regards,\nAdmissions Team'
    },
    {
      name: 'Admission Confirmed',
      channel: 'EMAIL',
      subject: '🎉 Congratulations! Your Admission is Confirmed',
      content: 'Hi ${name},\n\nWe are thrilled to inform you that your admission to ${programName} has been officially confirmed!\n\nEnrollment ID: ${enrollmentId}\n\nOur finance team will contact you shortly regarding fee payment.'
    },
    {
      name: 'Fee Due Reminder',
      channel: 'WHATSAPP',
      content: 'Hi ${name}, this is a friendly reminder that your fee payment of ₹${amount} is due on ${dueDate}. Please pay soon to avoid any late fees.'
    },
    {
      name: 'Payment Receipt',
      channel: 'EMAIL',
      subject: '💰 Payment Received - Thank You',
      content: 'Hi ${name},\n\nWe have received your payment of ₹${amount} for ${purpose}.\n\nTransaction ID: ${transactionId}\nDate: ${paymentDate}'
    },
    {
      name: 'Re-engagement Message',
      channel: 'WHATSAPP',
      content: 'Hi ${name}, we haven\'t heard from you in a while! Are you still interested in pursuing your studies? Reply if you\'d like to chat!'
    },
    {
      name: 'Application Rejected',
      channel: 'EMAIL',
      subject: 'Update regarding your application',
      content: 'Hi ${name},\n\nThank you for your interest. Unfortunately, your application has been declined at this stage due to: ${reason}.\n\nWe wish you the best for your future endeavors.'
    },

    // --- 2. STAFF ALERTS (INTERNAL) ---
    {
      name: 'Internal: New Lead Alert',
      channel: 'INTERNAL',
      subject: '🚀 New Lead Assigned',
      content: 'New lead: ${name} from ${source}. Priority: ${priority}'
    },
    {
      name: 'Internal: Follow-up Reminder',
      channel: 'INTERNAL',
      subject: '📅 Upcoming Follow-up',
      content: 'Call with ${leadName} in ${mins} minutes. Notes: ${notes}'
    },
    {
      name: 'Internal: Follow-up Overdue',
      channel: 'INTERNAL',
      subject: '⚠️ Follow-up OVERDUE',
      content: 'Missed call with ${leadName}. It was scheduled for ${scheduledAt}. Please call ASAP!'
    },
    {
      name: 'Internal: Counseling Handover',
      channel: 'INTERNAL',
      subject: '🤝 Counseling Handover',
      content: 'Lead ${name} has been assigned to you for counseling. Priority: ${priority}'
    },
    {
      name: 'Internal: Admission Alert',
      channel: 'INTERNAL',
      subject: '🎓 New Admission Confirmed',
      content: 'Student ${leadName} has confirmed admission for ${programName}. Finance setup needed.'
    },
    {
      name: 'Internal: Payment Alert',
      channel: 'INTERNAL',
      subject: '💸 Payment Received',
      content: 'Payment of ₹${amount} received from ${name} for ${purpose}.'
    },
    {
      name: 'Internal: Daily Task Summary',
      channel: 'EMAIL',
      subject: '📋 Your Daily Summary - ${date}',
      content: 'Hi ${name},\n\nYou have ${count} follow-ups scheduled for today. Good luck!'
    },
    {
      name: 'Internal: Weekly Finance Report',
      channel: 'EMAIL',
      subject: '📊 Weekly Finance Summary',
      content: 'Total collections this week: ₹${amount}. Week: ${week}'
    },
    {
      name: 'Internal: System Backup',
      channel: 'INTERNAL',
      subject: '💾 Backup Complete',
      content: 'The daily database backup has been successfully completed.'
    }
  ];

  // UPSERT TEMPLATES
  for (const t of templates) {
    await prisma.messageTemplate.upsert({
      where: { name: t.name },
      update: t,
      create: t
    });
  }

  console.log('✅ Templates Seeded. Creating/Updating Rules...');

  const rules = [
    // EXTERNAL RULES
    { trigger: 'LEAD_CREATED', channel: 'EMAIL', templateName: 'Welcome Email (Lead Created)', offsets: [0] },
    { trigger: 'LEAD_CREATED', channel: 'WHATSAPP', templateName: 'Welcome WhatsApp (Lead Created)', offsets: [0] },
    { trigger: 'LEAD_ASSIGNED', channel: 'WHATSAPP', templateName: 'Lead Assignment Notification', offsets: [0] },
    { trigger: 'FOLLOW_UP_CREATED', channel: 'WHATSAPP', templateName: 'Call Reminder (Lead)', offsets: [-60, -10] },
    { trigger: 'COUNSELING_SCHEDULED', channel: 'EMAIL', templateName: 'Counseling Invite', offsets: [0, -1440, -60] },
    { trigger: 'WEBINAR_REGISTERED', channel: 'EMAIL', templateName: 'Webinar Confirmation', offsets: [0] },
    { trigger: 'WEBINAR_STARTING', channel: 'WHATSAPP', templateName: 'Webinar Reminder', offsets: [-1440, -60, -15] },
    { trigger: 'APPLICATION_STARTED', channel: 'EMAIL', templateName: 'Application Update', offsets: [0] },
    { trigger: 'APPLICATION_SUBMITTED', channel: 'EMAIL', templateName: 'Application Update', offsets: [0] },
    { trigger: 'APPLICATION_VERIFIED', channel: 'EMAIL', templateName: 'Application Update', offsets: [0] },
    { trigger: 'APPLICATION_REJECTED', channel: 'EMAIL', templateName: 'Application Rejected', offsets: [0] },
    { trigger: 'ADMISSION_CONFIRMED', channel: 'EMAIL', templateName: 'Admission Confirmed', offsets: [0] },
    { trigger: 'FEE_DUE_REMINDER', channel: 'WHATSAPP', templateName: 'Fee Due Reminder', offsets: [-4320, -1440, 0] },
    { trigger: 'PAYMENT_RECEIVED', channel: 'EMAIL', templateName: 'Payment Receipt', offsets: [0] },
    { trigger: 'RE_ENGAGEMENT_DRIP', channel: 'WHATSAPP', templateName: 'Re-engagement Message', offsets: [2880, 10080] },

    // INTERNAL RULES
    { trigger: 'LEAD_CREATED', channel: 'INTERNAL', templateName: 'Internal: New Lead Alert', offsets: [0] },
    { trigger: 'LEAD_ASSIGNED', channel: 'INTERNAL', templateName: 'Internal: New Lead Alert', offsets: [0] },
    { trigger: 'FOLLOW_UP_CREATED', channel: 'INTERNAL', templateName: 'Internal: Follow-up Reminder', offsets: [-30, -10] },
    { trigger: 'FOLLOW_UP_OVERDUE', channel: 'INTERNAL', templateName: 'Internal: Follow-up Overdue', offsets: [60] },
    { trigger: 'COUNSELING_SCHEDULED', channel: 'INTERNAL', templateName: 'Internal: Counseling Handover', offsets: [0, -30, -10] },
    { trigger: 'ADMISSION_CONFIRMED', channel: 'INTERNAL', templateName: 'Internal: Admission Alert', offsets: [0] },
    { trigger: 'PAYMENT_RECEIVED', channel: 'INTERNAL', templateName: 'Internal: Payment Alert', offsets: [0] },
    { trigger: 'DAILY_SUMMARY_TELECALLER', channel: 'EMAIL', templateName: 'Internal: Daily Task Summary', offsets: [0] },
    { trigger: 'DAILY_SUMMARY_COUNSELOR', channel: 'EMAIL', templateName: 'Internal: Daily Task Summary', offsets: [0] },
    { trigger: 'WEEKLY_FINANCE_REPORT', channel: 'EMAIL', templateName: 'Internal: Weekly Finance Report', offsets: [0] },
    { trigger: 'SYSTEM_BACKUP', channel: 'INTERNAL', templateName: 'Internal: System Backup', offsets: [0] }
  ];

  for (const r of rules) {
    const template = await prisma.messageTemplate.findUnique({ where: { name: r.templateName } });
    if (template) {
      const existing = await prisma.notificationRule.findFirst({
        where: { trigger: r.trigger, channel: r.channel, templateId: template.id }
      });

      if (!existing) {
        await prisma.notificationRule.create({
          data: {
            name: `${r.trigger} ${r.channel} Default`,
            trigger: r.trigger,
            channel: r.channel,
            templateId: template.id,
            isActive: true,
            offsets: r.offsets
          }
        });
      } else {
        await prisma.notificationRule.update({
          where: { id: existing.id },
          data: { offsets: r.offsets, isActive: true }
        });
      }
    }
  }

  console.log('🎉 COMPREHENSIVE Notification System Fully Seeded!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
