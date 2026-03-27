import { Request, Response } from 'express';
import CounselingService from '../services/counseling.service';

import prisma from '../config/prisma';

export const scheduleFollowUp = async (req: any, res: Response) => {
  try {
    let counselorId = req.user?.id;
    if (!counselorId) {
      const user = await prisma.user.findFirst();
      counselorId = user?.id;
    }

    const followUp = await CounselingService.scheduleFollowUp({
      ...req.body,
      counselorId,
    });
    res.status(201).json(followUp);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const logCounseling = async (req: any, res: Response) => {
  try {
    let counselorId = req.user?.id;
    if (!counselorId) {
      const user = await prisma.user.findFirst();
      counselorId = user?.id;
    }

    const log = await CounselingService.logCounseling({
      ...req.body,
      counselorId,
    });
    res.status(201).json(log);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMySchedule = async (req: any, res: Response) => {
  try {
    let counselorId = req.user?.id;
    if (!counselorId) {
      const user = await prisma.user.findFirst();
      counselorId = user?.id;
    }

    if (!counselorId) {
      return res.status(401).json({ message: 'No counselor found' });
    }

    const schedule = await CounselingService.getCounselorSchedule(counselorId);
    res.json(schedule);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudents = async (req: Request, res: Response) => {
  try {
    const students = await CounselingService.getStudentsForCounseling();
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
