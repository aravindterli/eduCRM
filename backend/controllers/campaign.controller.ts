import { Request, Response } from 'express';
import CampaignService from '../services/campaign.service';

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const campaign = await CampaignService.createCampaign(req.body);
    res.status(201).json(campaign);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getROI = async (req: Request, res: Response) => {
  try {
    const roi = await CampaignService.getCampaignROI();
    res.json(roi);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const campaign = await CampaignService.updateCampaign(req.params.id, req.body);
    res.json(campaign);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    await CampaignService.deleteCampaign(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
