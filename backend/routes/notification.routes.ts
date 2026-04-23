import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

router.get('/', NotificationController.getAll);
router.put('/mark-all-read', NotificationController.markAllRead);
router.put('/:id/read', NotificationController.markRead);
router.delete('/clear-all', NotificationController.clearAll);
router.delete('/:id', NotificationController.delete);

export default router;
