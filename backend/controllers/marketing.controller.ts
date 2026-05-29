import { Request, Response } from 'express';
import MarketingService from '../services/marketing.service';

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const userReq = req as any;
    const tenantId = userReq.user?.tenantId;
    if (!tenantId) throw new Error('Tenant ID not found in token');

    const campaign = await MarketingService.createCampaign(tenantId, req.body);
    res.status(201).json(campaign);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const userReq = req as any;
    const tenantId = userReq.user?.tenantId;
    if (!tenantId) throw new Error('Tenant ID not found in token');

    const campaigns = await MarketingService.getCampaigns(tenantId);
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const executeCampaign = async (req: Request, res: Response) => {
  try {
    const userReq = req as any;
    const tenantId = userReq.user?.tenantId;
    if (!tenantId) throw new Error('Tenant ID not found in token');

    const result = await MarketingService.executeCampaign(tenantId, req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const userReq = req as any;
    const tenantId = userReq.user?.tenantId;
    if (!tenantId) throw new Error('Tenant ID not found in token');

    const analytics = await MarketingService.getCampaignAnalytics(tenantId, req.params.id);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
