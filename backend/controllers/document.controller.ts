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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB individual file limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG and PNG are allowed.'));
    }
  }
});

// Helper to get Tenant Storage Limit in bytes
const getTenantStorageLimit = async (tenantId: string): Promise<{ limitBytes: number; plan: string }> => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return { limitBytes: 100 * 1024 * 1024, plan: 'PRO' }; // Default fallback
  }

  const plan = tenant.subscriptionPlan || 'FREE';
  let limitBytes = 100 * 1024 * 1024; // PRO = 100MB

  if (plan === 'FREE') {
    limitBytes = 10 * 1024 * 1024; // FREE = 10MB
  } else if (plan === 'ENTERPRISE') {
    limitBytes = 1024 * 1024 * 1024; // ENTERPRISE = 1GB
  }

  // Allow custom override via config JSON
  if (tenant.config && typeof tenant.config === 'object') {
    const configObj = tenant.config as any;
    if (configObj.storageLimitBytes) {
      limitBytes = Number(configObj.storageLimitBytes);
    }
  }

  return { limitBytes, plan };
};

// Helper to calculate total storage used by a tenant in bytes
const getTenantStorageUsed = async (tenantId: string): Promise<number> => {
  const documents = await prisma.document.findMany({
    where: {
      application: {
        tenantId
      }
    }
  });

  let totalSize = 0;
  for (const doc of documents) {
    const filePath = path.join(__dirname, '../../', doc.url);
    if (fs.existsSync(filePath)) {
      try {
        totalSize += fs.statSync(filePath).size;
      } catch (err) {
        // Ignore files missing from disk
      }
    }
  }
  return totalSize;
};

// Staff Upload Document (Authenticated)
export const uploadDocument = async (req: any, res: Response) => {
  try {
    const { applicationId, type, name } = req.body;
    const tenantId = req.user.tenantId;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Dynamic storage check
    const currentUsed = await getTenantStorageUsed(tenantId);
    const { limitBytes } = await getTenantStorageLimit(tenantId);
    const uploadedSize = req.file.size;

    if (currentUsed + uploadedSize > limitBytes) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        message: `Storage quota exceeded. Your organization has used ${(currentUsed / (1024 * 1024)).toFixed(2)}MB of ${(limitBytes / (1024 * 1024)).toFixed(2)}MB quota limit.` 
      });
    }

    // Ensure tenant isolated directory exists and move file there
    const tenantDir = path.join(uploadDir, tenantId);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }
    const newPath = path.join(tenantDir, req.file.filename);
    fs.renameSync(req.file.path, newPath);
    req.file.path = newPath; // Update reference for safety

    const document = await prisma.document.create({
      data: {
        applicationId,
        type: type || 'GENERAL',
        name: name || req.file.originalname,
        url: `/uploads/documents/${tenantId}/${req.file.filename}`,
        status: 'PENDING'
      }
    });

    res.status(201).json(document);
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

// Student Public Upload Document (Unauthenticated)
export const uploadDocumentPublic = async (req: Request, res: Response) => {
  try {
    const { applicationId, type, name } = req.body;

    if (!applicationId) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'applicationId is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate Application & get Tenant ID
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Application booking not found' });
    }

    const tenantId = application.tenantId;

    // Dynamic storage check
    const currentUsed = await getTenantStorageUsed(tenantId);
    const { limitBytes } = await getTenantStorageLimit(tenantId);
    const uploadedSize = req.file.size;

    if (currentUsed + uploadedSize > limitBytes) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        message: 'Storage quota limit reached for this organization. Please contact your coordinator.' 
      });
    }

    // Ensure tenant isolated directory exists and move file there
    const tenantDir = path.join(uploadDir, tenantId);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }
    const newPath = path.join(tenantDir, req.file.filename);
    fs.renameSync(req.file.path, newPath);
    req.file.path = newPath; // Update reference for safety

    const document = await prisma.document.create({
      data: {
        applicationId,
        type: type || 'GENERAL',
        name: name || req.file.originalname,
        url: `/uploads/documents/${tenantId}/${req.file.filename}`,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      document
    });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

// Verify/Approve/Reject Document
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

// Get Documents for a single application
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

// Central Listing for Admins and Counselors (Tenant Wide)
export const getAllDocuments = async (req: any, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const { search, type, status, page = 1, limit = 20 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {
      application: {
        tenantId
      }
    };

    if (type) {
      whereClause.type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        {
          application: {
            lead: {
              name: { contains: search as string, mode: 'insensitive' }
            }
          }
        }
      ];
    }

    const total = await prisma.document.count({ where: whereClause });

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        application: {
          include: {
            lead: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            program: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    });

    res.json({
      success: true,
      documents,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Physically delete file from disk and remove DB record
export const deleteDocument = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const document = await prisma.document.findFirst({
      where: {
        id,
        application: {
          tenantId
        }
      }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete physically from disk
    const filePath = path.join(__dirname, '../../', document.url);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error physically deleting document file:', err);
      }
    }

    // Remove from database
    await prisma.document.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Document permanently deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieve storage metrics & plan breakdown
export const getStorageStats = async (req: any, res: Response) => {
  try {
    const tenantId = req.user.tenantId;

    const documents = await prisma.document.findMany({
      where: {
        application: {
          tenantId
        }
      }
    });

    let totalSize = 0;
    const typeBreakdown: Record<string, { size: number; count: number }> = {};
    const formatBreakdown: Record<string, { size: number; count: number }> = {};

    for (const doc of documents) {
      const filePath = path.join(__dirname, '../../', doc.url);
      let fileSize = 0;

      if (fs.existsSync(filePath)) {
        try {
          fileSize = fs.statSync(filePath).size;
        } catch (err) {}
      }

      totalSize += fileSize;

      // Group by document type
      const docType = doc.type || 'GENERAL';
      if (!typeBreakdown[docType]) typeBreakdown[docType] = { size: 0, count: 0 };
      typeBreakdown[docType].size += fileSize;
      typeBreakdown[docType].count += 1;

      // Group by file extension format
      const ext = path.extname(doc.url).replace('.', '').toUpperCase() || 'UNKNOWN';
      if (!formatBreakdown[ext]) formatBreakdown[ext] = { size: 0, count: 0 };
      formatBreakdown[ext].size += fileSize;
      formatBreakdown[ext].count += 1;
    }

    const { limitBytes, plan } = await getTenantStorageLimit(tenantId);

    res.json({
      success: true,
      totalStorageUsed: totalSize,
      storageLimitBytes: limitBytes,
      plan,
      documentCount: documents.length,
      typeBreakdown,
      formatBreakdown
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
