import { Router } from 'express';
import { getAllPrograms, updateProgram, createProgram } from '../controllers/program.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public route for landing page dropdowns
router.get('/public', getAllPrograms);

router.get('/', authenticate, authorize(['ADMIN', 'COUNSELOR']), getAllPrograms);
router.post('/', authenticate, authorize(['ADMIN']), createProgram);
router.patch('/:id', authenticate, authorize(['ADMIN']), updateProgram);

export default router;
