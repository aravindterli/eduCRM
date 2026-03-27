import prisma from '../config/prisma';

export class CampaignService {
  async createCampaign(data: any) {
    return await prisma.campaign.create({
      data: {
        name: data.name,
        source: data.source,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async getCampaignROI() {
    const campaigns = await prisma.campaign.findMany({
      include: {
        leads: {
          include: {
            application: { include: { admission: true } }
          }
        }
      }
    });

    return campaigns.map(c => {
      const totalLeads = c.leads.length;
      const conversions = c.leads.filter(l => l.application?.admission).length;
      const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;

      return {
        id: c.id,
        name: c.name,
        source: c.source,
        totalLeads,
        conversions,
        conversionRate: conversionRate.toFixed(2) + '%',
      };
    });
  }
  
  async updateCampaign(id: string, data: any) {
    return await prisma.campaign.update({
      where: { id },
      data: {
        name: data.name,
        source: data.source,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async deleteCampaign(id: string) {
    return await prisma.campaign.delete({
      where: { id },
    });
  }
}

export default new CampaignService();
