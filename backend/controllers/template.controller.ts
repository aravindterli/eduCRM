import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await prisma.messageTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });
    // Return templates directly without Meta synchronization
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, content, channel, subject } = req.body;
    const formattedName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const template = await prisma.messageTemplate.create({
      data: { 
        name: formattedName, 
        content, 
        channel,
        subject
      }
    });
    res.status(201).json(template);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, content, channel, subject } = req.body;
    const template = await prisma.messageTemplate.update({
      where: { id },
      data: { name, content, channel, subject }
    });
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.messageTemplate.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
