import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import ReportService from '../services/report.service';

export const getLeadReports = async (req: Request, res: Response) => {
  try {
    const reports = await ReportService.getLeadAnalytics(req.user.id, req.user.role);
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCounselerStats = async (req: Request, res: Response) => {
  try {
    const stats = await ReportService.getassignedToPerformance(req.user.id, req.user.role);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getConversionFunnel = async (req: Request, res: Response) => {
  try {
    const funnel = await ReportService.getConversionFunnel(req.user.id, req.user.role);
    res.json(funnel);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProgramPerformance = async (req: Request, res: Response) => {
  try {
    const performance = await ReportService.getProgramPerformance(req.user.id, req.user.role);
    res.json(performance);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFinancialAnalytics = async (req: Request, res: Response) => {
  try {
    const analytics = await ReportService.getFinancialAnalytics(req.user.id, req.user.role);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const activities = await ReportService.getRecentActivities(req.user.id, req.user.role);
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMonthlyReport = async (req: Request, res: Response) => {
  try {
    const report = await ReportService.getMonthlyReport(req.user.id, req.user.role);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadMonthlyPDF = async (req: Request, res: Response) => {
  try {
    const reportData = await ReportService.getMonthlyReport();
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=EduCRM_Report_${reportData.month.replace(' ', '_')}.pdf`);
    
    doc.pipe(res);
    await ReportService.generateMonthlyPDF(doc, reportData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadPaymentReceipt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt_${id.split('-')[0]}.pdf`);
    
    doc.pipe(res);
    await ReportService.generateReceiptPDF(doc, id);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
