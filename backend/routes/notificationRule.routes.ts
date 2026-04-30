import { Router } from 'express';
import NotificationRuleController from '../controllers/notificationRule.controller';
import { authenticate, authorize } from '../middleware/auth';


const router = Router();

// All routes require authentication; create/update/delete require ADMIN
router.use(authenticate);

// ─── SPECIFIC PATHS MUST COME BEFORE PARAMETERIZED ROUTES ──────────────────

// Queue management
router.get('/queue', NotificationRuleController.getQueue);
router.post('/queue/:id/retry', NotificationRuleController.retryQueued);
router.delete('/queue/:id', NotificationRuleController.cancelQueued);

// Manual one-shot scheduling
router.post('/schedule', authorize(['ADMIN']), NotificationRuleController.scheduleOne);

// ─── Rule CRUD (parameterized last) ────────────────────────────────────────
router.get('/', NotificationRuleController.getRules);
router.post('/', authorize(['ADMIN']), NotificationRuleController.createRule);
router.put('/:id', authorize(['ADMIN']), NotificationRuleController.updateRule);
router.delete('/:id', authorize(['ADMIN']), NotificationRuleController.deleteRule);
router.patch('/:id/toggle', authorize(['ADMIN']), NotificationRuleController.toggleRule);


export default router;
