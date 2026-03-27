import { Router } from 'express';
import { 
  createWebinar, 
  getWebinars, 
  registerLead, 
  updateWebinar, 
  deleteWebinar,
  getWebinarPublic,
  registerLeadPublic 
} from '../controllers/webinar.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public Routes
router.get('/:id/public', getWebinarPublic);
router.post('/:id/register-public', registerLeadPublic);

// Protected Routes
router.use(authenticate);
router.use(authorize(['ADMIN', 'MARKETING_TEAM', 'TELECALLER', 'COUNSELOR']));

router.get('/', getWebinars);
router.post('/', createWebinar);
router.put('/:id', updateWebinar);
router.delete('/:id', deleteWebinar);
router.post('/:id/register', registerLead);

export default router;
