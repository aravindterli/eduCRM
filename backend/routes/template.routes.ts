import { Router } from 'express';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../controllers/template.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['ADMIN', 'MARKETING', 'COUNSELOR']), getTemplates);
router.post('/', authorize(['ADMIN', 'MARKETING']), createTemplate);
router.put('/:id', authorize(['ADMIN', 'MARKETING']), updateTemplate);
router.delete('/:id', authorize(['ADMIN', 'MARKETING']), deleteTemplate);

export default router;
