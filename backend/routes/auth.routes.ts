import { Router } from 'express';
import { login, register, getMe, getUsers, updateProfile, getTenantBranding, getRoles, createRole, deleteRole, updateRolePermissions, inviteUser, acceptInvite, getInvitations, resendInvitation } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', authenticate, authorize(['ADMIN', 'SUPERADMIN']), register);
router.get('/me', authenticate, getMe);
router.get('/tenant/branding', authenticate, getTenantBranding);
router.get('/users', authenticate, authorize(['ADMIN', 'SUPERADMIN']), getUsers);
router.patch('/profile', authenticate, updateProfile);
router.get('/roles', authenticate, authorize(['ADMIN']), getRoles);
router.post('/roles', authenticate, authorize(['ADMIN']), createRole);
router.delete('/roles/:id', authenticate, authorize(['ADMIN']), deleteRole);
router.put('/roles/:id/permissions', authenticate, authorize(['ADMIN']), updateRolePermissions);
router.post('/invite', authenticate, authorize(['ADMIN']), inviteUser);
router.get('/invitations', authenticate, authorize(['ADMIN']), getInvitations);
router.post('/invitations/:id/resend', authenticate, authorize(['ADMIN']), resendInvitation);
router.post('/accept-invite', acceptInvite);

export default router;
