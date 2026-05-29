
import { Request, Response } from 'express';
import ProgramService from '../services/program.service';

export const getAllPrograms = async (req: Request, res: Response) => {
  try {
    const programs = await ProgramService.getAllPrograms((req as any).user?.tenantId);
    res.json(programs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProgram = async (req: Request, res: Response) => {
  try {
    const program = await ProgramService.updateProgram(req.params.id, req.body);
    res.json(program);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createProgram = async (req: Request, res: Response) => {
  try {
    const program = await ProgramService.createProgram({ ...req.body, tenantId: (req as any).user?.tenantId });
    res.status(201).json(program);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
