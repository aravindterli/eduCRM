import { Router } from 'express';
import { createCampaign, getROI, updateCampaign, deleteCampaign } from '../controllers/campaign.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'MARKETING_TEAM']));

router.post('/', createCampaign);
router.get('/roi', getROI);
router.patch('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);

export default router;
