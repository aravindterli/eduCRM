import prisma from '../config/prisma';
import notificationDispatcherService from './notificationDispatcher.service';

export class MarketingService {
  async createCampaign(tenantId: string, data: any) {
    return await (prisma as any).marketingCampaign.create({
      data: {
        tenantId,
        name: data.name,
        channel: data.channel,
        source: data.source,
        templateId: data.templateId,
        audienceFilters: data.audienceFilters,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        status: 'DRAFT',
      },
    });
  }

  async getCampaigns(tenantId: string) {
    return await (prisma as any).marketingCampaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveAudience(tenantId: string, filters: any) {
    const where: any = { tenantId };

    if (filters.city) {
      where.location = filters.city;
    }
    if (filters.tag) {
      where.tag = filters.tag;
    }
    if (filters.stage) {
      where.stage = filters.stage;
    }
    if (filters.leadSource) {
      where.leadSource = filters.leadSource;
    }

    return await prisma.lead.findMany({
      where,
      select: { id: true, phone: true, email: true, name: true },
    });
  }

  async executeCampaign(tenantId: string, campaignId: string) {
    const campaign = await (prisma as any).marketingCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) throw new Error('Campaign not found');
    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      throw new Error('Campaign already executed or in progress');
    }

    const leads = await this.resolveAudience(tenantId, campaign.audienceFilters || {});
    
    if (leads.length === 0) {
      await (prisma as any).marketingCampaign.update({
        where: { id: campaignId },
        data: { status: 'COMPLETED' },
      });
      return { success: true, message: 'No leads found for audience' };
    }

    // Update status to IN_PROGRESS
    await (prisma as any).marketingCampaign.update({
      where: { id: campaignId },
      data: { status: 'IN_PROGRESS' },
    });

    // Enqueue notifications
    const rows = leads.map((lead: any) => ({
      tenantId,
      trigger: 'MARKETING_CAMPAIGN',
      channel: campaign.channel,
      recipientId: null,
      contactInfo: campaign.channel === 'EMAIL' ? lead.email : lead.phone,
      templateId: campaign.templateId,
      payload: { name: lead.name }, // Pass variables to template
      scheduledAt: campaign.scheduledAt || new Date(),
      leadId: lead.id,
      marketingCampaignId: campaignId,
      status: 'PENDING',
    }));

    await (prisma as any).scheduledNotification.createMany({ data: rows });

    // Mark as COMPLETED (meaning queued successfully)
    await (prisma as any).marketingCampaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED' },
    });

    return { success: true, count: leads.length };
  }

  async getCampaignAnalytics(tenantId: string, campaignId: string) {
    const campaign = await (prisma as any).marketingCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) throw new Error('Campaign not found');

    const leadsGenerated = await prisma.lead.count({
      where: {
        tenantId,
        marketingCampaignId: campaignId,
      },
    });

    const sentCount = await (prisma as any).scheduledNotification.count({
      where: { marketingCampaignId: campaignId, status: 'SENT' },
    });

    const failedCount = await (prisma as any).scheduledNotification.count({
      where: { marketingCampaignId: campaignId, status: 'FAILED' },
    });

    const pendingCount = await (prisma as any).scheduledNotification.count({
      where: { marketingCampaignId: campaignId, status: 'PENDING' },
    });

    const deliveredCount = await (prisma as any).scheduledNotification.count({
      where: { marketingCampaignId: campaignId, status: 'DELIVERED' },
    });

    const openedCount = await (prisma as any).scheduledNotification.count({
      where: { marketingCampaignId: campaignId, status: 'OPENED' },
    });

    const clickedCount = await (prisma as any).scheduledNotification.count({
      where: { marketingCampaignId: campaignId, status: 'CLICKED' },
    });

    const repliedCount = await (prisma as any).scheduledNotification.count({
      where: { marketingCampaignId: campaignId, status: 'REPLIED' },
    });

    const convertedCount = await prisma.lead.count({
      where: {
        tenantId,
        marketingCampaignId: campaignId,
        stage: 'ADMISSION_CONFIRMED',
      },
    });

    return {
      campaignName: campaign.name,
      status: campaign.status,
      leadsGenerated,
      sent: sentCount,
      failed: failedCount,
      pending: pendingCount,
      delivered: deliveredCount,
      opened: openedCount,
      clicked: clickedCount,
      replied: repliedCount,
      converted: convertedCount,
      totalTargeted: sentCount + failedCount + pendingCount + deliveredCount + openedCount + clickedCount + repliedCount,
    };
  }
}

export default new MarketingService();
