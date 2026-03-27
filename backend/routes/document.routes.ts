import { Router } from 'express';
import { upload, uploadDocument, verifyDocument, getApplicationDocuments } from '../controllers/document.controller';
import { authenticate, authorize } from '../middleware/auth';
import express from 'express';
import path from 'path';

const router = Router();

// Endpoint to statically serve uploaded documents securely
router.use('/files', authenticate, express.static(path.join(__dirname, '../../uploads/documents')));

router.use(authenticate);

// Allow counselors and telecallers to upload
router.post('/upload', authorize(['ADMIN', 'COUNSELOR', 'TELECALLER']), upload.single('file'), uploadDocument);

// Get documents for a specific application
router.get('/application/:applicationId', authorize(['ADMIN', 'COUNSELOR', 'TELECALLER']), getApplicationDocuments);

// Only Admins and Counselors can verify documents
router.patch('/:id/verify', authorize(['ADMIN', 'COUNSELOR']), verifyDocument);

export default router;
