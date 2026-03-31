import { Request, Response } from 'express';
import ApplicationService from '../services/application.service';

export const createApplication = async (req: Request, res: Response) => {
  try {
    const app = await ApplicationService.createApplication(req.body);
    res.status(201).json(app);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const app = await ApplicationService.updateStatus(req.params.id, req.body.status, req.body.reason);
    res.json(app);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getApplications = async (req: Request, res: Response) => {
  try {
    const apps = await ApplicationService.getAllApplications();
    res.json(apps);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmAdmission = async (req: Request, res: Response) => {
  try {
    const admission = await ApplicationService.confirmAdmission(req.params.id);
    res.status(201).json(admission);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const doc = await ApplicationService.uploadDocument(req.params.id, req.body);
    res.status(201).json(doc);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getAdmissionLetter = async (req: Request, res: Response) => {
  try {
    const result = await ApplicationService.getAdmissionLetter(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
