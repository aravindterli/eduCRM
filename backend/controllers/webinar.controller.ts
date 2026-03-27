import { Request, Response } from 'express';
import WebinarService from '../services/webinar.service';

export const createWebinar = async (req: Request, res: Response) => {
  try {
    const webinar = await WebinarService.createWebinar(req.body);
    res.status(201).json(webinar);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateWebinar = async (req: Request, res: Response) => {
  try {
    const webinar = await WebinarService.updateWebinar(req.params.id, req.body);
    res.json(webinar);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteWebinar = async (req: Request, res: Response) => {
  try {
    await WebinarService.deleteWebinar(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const registerLead = async (req: Request, res: Response) => {
  try {
    const reg = await WebinarService.registerLead(req.params.id, req.body.leadId);
    res.status(201).json(reg);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getWebinars = async (req: Request, res: Response) => {
  try {
    const webinars = await WebinarService.getWebinars();
    res.json(webinars);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getWebinarPublic = async (req: Request, res: Response) => {
  try {
    const webinar = await WebinarService.getWebinarById(req.params.id);
    if (!webinar) {
      return res.status(404).json({ message: 'Webinar not found' });
    }
    res.json(webinar);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const registerLeadPublic = async (req: Request, res: Response) => {
  try {
    const result = await WebinarService.registerLeadPublic(req.params.id, req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
