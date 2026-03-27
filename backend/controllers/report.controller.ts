import { Request, Response } from 'express';
import ReportService from '../services/report.service';

export const getLeadReports = async (req: Request, res: Response) => {
  try {
    const reports = await ReportService.getLeadAnalytics();
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCounselerStats = async (req: Request, res: Response) => {
  try {
    const stats = await ReportService.getCounselorPerformance();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getConversionFunnel = async (req: Request, res: Response) => {
  try {
    const funnel = await ReportService.getConversionFunnel();
    res.json(funnel);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProgramPerformance = async (req: Request, res: Response) => {
  try {
    const performance = await ReportService.getProgramPerformance();
    res.json(performance);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFinancialAnalytics = async (req: Request, res: Response) => {
  try {
    const analytics = await ReportService.getFinancialAnalytics();
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const activities = await ReportService.getRecentActivities();
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
