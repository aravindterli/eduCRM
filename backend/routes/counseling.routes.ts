import { Router } from 'express';
import { scheduleFollowUp, logCounseling, getMySchedule, getStudents } from '../controllers/counseling.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'TELECALLER', 'COUNSELOR']));

router.post('/follow-up', scheduleFollowUp);
router.post('/log', logCounseling);
router.get('/schedule', getMySchedule);
router.get('/students', getStudents);

export default router;
