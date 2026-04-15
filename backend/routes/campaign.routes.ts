import { Router } from 'express';
import { createCampaign, getROI, updateCampaign, deleteCampaign, handleBulkBroadcast, getBroadcastHistory } from '../controllers/campaign.controller';
import { authenticate, authorize } from '../middleware/auth';
import multer from 'multer';

const upload = multer({ dest: 'uploads/temp/' });


const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'MARKETING_TEAM']));

router.post('/', createCampaign);
router.get('/broadcasts/history', getBroadcastHistory);
router.post('/broadcast', upload.single('file'), handleBulkBroadcast);
router.get('/roi', getROI);
router.patch('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);

export default router;
