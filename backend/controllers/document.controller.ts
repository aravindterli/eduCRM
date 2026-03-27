import { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG and PNG are allowed.'));
    }
  }
});

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { applicationId, type, name } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = await prisma.document.create({
      data: {
        applicationId,
        type: type || 'GENERAL',
        name: name || req.file.originalname,
        url: `/uploads/documents/${req.file.filename}`,
        status: 'PENDING'
      }
    });

    res.status(201).json(document);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // status: APPROVED or REJECTED

    const document = await prisma.document.update({
      where: { id },
      data: {
        status,
        remarks
      }
    });

    res.json(document);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getApplicationDocuments = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const documents = await prisma.document.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(documents);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
