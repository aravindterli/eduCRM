import { Router } from 'express';
import { 
  createApplication, 
  updateStatus, 
  getApplications, 
  confirmAdmission, 
  uploadDocument, 
  getAdmissionLetter,
  getPublicApplicationDetails
} from '../controllers/application.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public route for onboarding paperwork
router.get('/public/:id', getPublicApplicationDetails);

router.use(authenticate);
router.use(authorize(['ADMIN', 'COUNSELOR']));

router.post('/', createApplication);
router.get('/', getApplications);
router.patch('/:id/status', updateStatus);
router.post('/:id/confirm', confirmAdmission);
router.get('/:id/letter', getAdmissionLetter);
router.post('/:id/documents', uploadDocument);

export default router;
