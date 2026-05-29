import { Router } from 'express';
import { 
  upload, 
  uploadDocument, 
  verifyDocument, 
  getApplicationDocuments, 
  uploadDocumentPublic,
  getAllDocuments,
  deleteDocument,
  getStorageStats
} from '../controllers/document.controller';
import { authenticate, authorize } from '../middleware/auth';
import express from 'express';
import path from 'path';

const router = Router();

// Endpoint to statically serve uploaded documents securely
router.use('/files', authenticate, express.static(path.join(__dirname, '../../uploads/documents')));

// Public student document upload - does not require standard authentication
router.post('/public/upload', upload.single('file'), uploadDocumentPublic);

router.use(authenticate);

// Allow assignedTos and telecallers to upload
router.post('/upload', authorize(['ADMIN', 'COUNSELOR', 'TELECALLER']), upload.single('file'), uploadDocument);

// Get documents for a specific application
router.get('/application/:applicationId', authorize(['ADMIN', 'COUNSELOR', 'TELECALLER']), getApplicationDocuments);

// Only Admins and counselors can verify/update documents
router.patch('/:id/verify', authorize(['ADMIN', 'COUNSELOR']), verifyDocument);

// Central Listing (search, filters, etc.)
router.get('/all', authorize(['ADMIN', 'COUNSELOR']), getAllDocuments);

// Storage analytics and limits
router.get('/storage-stats', authorize(['ADMIN', 'COUNSELOR']), getStorageStats);

// Permanent document physical and DB deletion
router.delete('/:id', authorize(['ADMIN', 'COUNSELOR']), deleteDocument);

export default router;
