import { Router } from 'express';
import { createCampaign, getCampaigns, executeCampaign, getAnalytics } from '../controllers/marketing.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'MARKETING_TEAM']));

router.post('/', createCampaign);
router.get('/', getCampaigns);
router.post('/:id/execute', executeCampaign);
router.get('/:id/analytics', getAnalytics);

export default router;
