import { Router } from 'express';
import { login, register, getMe, getUsers, updateProfile } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', authenticate, authorize(['ADMIN']), register);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, authorize(['ADMIN']), getUsers);
router.patch('/profile', authenticate, updateProfile);

export default router;
