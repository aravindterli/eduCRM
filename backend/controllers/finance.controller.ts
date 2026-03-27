
import { Request, Response } from 'express';
import FeeService from '../services/fee.service';

export const recordPayment = async (req: Request, res: Response) => {
  try {
    const payment = await FeeService.recordPayment(req.body);
    res.status(201).json(payment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const generatePaymentLink = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await FeeService.generatePaymentLink(id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllFees = async (req: Request, res: Response) => {
  try {
    const fees = await FeeService.getAllFees();
    res.json(fees);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRevenueStats = async (req: Request, res: Response) => {
  try {
    const stats = await FeeService.getRevenueStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const syncPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await FeeService.syncPaymentStatus(id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getExistingLink = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await FeeService.getExistingLink(id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
