import { Router } from 'express';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../controllers/template.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['ADMIN', 'MARKETING_TEAM', 'COUNSELOR']), getTemplates);
router.post('/', authorize(['ADMIN', 'MARKETING_TEAM']), createTemplate);
router.put('/:id', authorize(['ADMIN', 'MARKETING_TEAM']), updateTemplate);
router.delete('/:id', authorize(['ADMIN', 'MARKETING_TEAM']), deleteTemplate);

export default router;
