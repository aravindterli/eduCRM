import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import crypto from 'crypto';
import { CommunicationService } from '../services/communication.service';

const commService = new CommunicationService();

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        role: true,
        tenant: true
      },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Permissions are now fully driven by the tenant-specific Role object
    const token = generateToken({ 
      id: user.id, 
      email: user.email, 
      role: user.role.type,
      tenantId: user.tenantId,
      sector: user.tenant?.sector || 'GENERIC'
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.type,
        tenantId: user.tenantId,
        sector: user.tenant?.sector || 'GENERIC',
        subscriptionStatus: user.tenant?.subscriptionStatus || 'ACTIVE',
        theme: user.theme,
        accent: user.accent,
        customRoleName: user.role.name || null,
        permissions: user.role.permissions || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
    const { name, email, password, roleType, tenantId } = req.body;
    const creator = (req as any).user;

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await hashPassword(password);

      // If tenantId not provided, use creator's tenantId
      const targetTenantId = tenantId || creator?.tenantId || null;
      if (!targetTenantId) {
        return res.status(400).json({ message: 'Tenant ID is required' });
      }

      const role = await prisma.role.findUnique({
        where: {
          tenantId_type: {
            tenantId: targetTenantId,
            type: roleType
          }
        }
      });

      if (!role) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          roleId: role.id,
          tenantId: targetTenantId,
        },
      });

    res.status(201).json({ message: 'User created successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req: any, res: Response) => {
  res.json(req.user);
};

export const getTenantBranding = async (req: any, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ message: 'No tenant associated with user' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
    });
    
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    
    const config = tenant.config as any;
    res.json({
      name: tenant.name,
      logo: config?.brandLogo || null
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const where: any = {};
    
    if (user?.tenantId) {
      where.tenantId = user.tenantId;
    }

    const users = await prisma.user.findMany({
      where,
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });
    
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.type,
      createdAt: user.createdAt
    }));

    res.json(formattedUsers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  const { name, email, theme, accent } = req.body;
  const userId = req.user.id;

  try {
    // If email is being changed, check if it's already taken
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        email: email || undefined,
        theme: theme || undefined,
        accent: accent || undefined,
      },
      include: { role: true, tenant: true }
    });

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role.type,
      tenantId: updatedUser.tenantId,
      sector: updatedUser.tenant.sector,
      theme: updatedUser.theme,
      accent: updatedUser.accent,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRoles = async (req: any, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      where: {
        tenantId: req.user.tenantId,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(roles);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createRole = async (req: any, res: Response) => {
  const { name, type, permissions } = req.body;

  try {
    const role = await prisma.role.create({
      data: {
        name,
        type: type as any,
        permissions: permissions || {},
        tenantId: req.user.tenantId,
      }
    });
    res.status(201).json(role);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteRole = async (req: any, res: Response) => {
  const { id } = req.params;

  try {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    if (role.tenantId !== req.user.tenantId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (role.type === 'ADMIN' || role.type === 'SUPERADMIN') {
      return res.status(400).json({ message: 'Cannot delete system roles' });
    }

    await prisma.role.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRolePermissions = async (req: any, res: Response) => {
  const { id } = req.params;
  const { permissions } = req.body;

  try {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return res.status(404).json({ message: 'Role not found' });

    // Prevent editing admin role
    if (role.type === 'ADMIN' || role.type === 'SUPERADMIN') {
      return res.status(403).json({ message: 'Cannot modify admin role permissions' });
    }

    const updated = await prisma.role.update({
      where: { id },
      data: { permissions },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const inviteUser = async (req: any, res: Response) => {
  const { email, roleId } = req.body;
  const creator = req.user;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });
    if (!role || (role.tenantId !== creator.tenantId && role.tenantId !== null)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const token = crypto.randomBytes(32).toString('hex');

    const invitation = await prisma.invitation.create({
      data: {
        email,
        tenantId: creator.tenantId,
        roleId: role.id,
        token,
      },
      include: { tenant: true }
    });

    const tenantName = invitation.tenant.name;
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${token}`;

    await commService.transporter.sendMail({
      from: process.env.EMAIL_FROM || '"CentraCRM" <no-reply@centracrm.com>',
      to: email,
      subject: `Invitation to join ${tenantName} on CentraCRM`,
      text: `You have been invited to join ${tenantName} on CentraCRM. Click the link to accept and set your password: ${inviteLink}`,
      html: `<p>You have been invited to join <strong>${tenantName}</strong> on CentraCRM.</p><p>Click the link below to accept and set your password:</p><a href="${inviteLink}">${inviteLink}</a>`
    });

    res.status(201).json({ message: 'Invitation sent successfully', invitation });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptInvite = async (req: Request, res: Response) => {
  const { token, password, name } = req.body;

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { tenant: true }
    });

    if (!invitation || invitation.status !== 'PENDING') {
      return res.status(400).json({ message: 'Invalid or expired invitation' });
    }

    const hashedPassword = await hashPassword(password);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email: invitation.email,
        password: hashedPassword,
        roleId: invitation.roleId,
        tenantId: invitation.tenantId,
      },
    });

    // Update invitation status
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });

    res.json({ message: 'Invitation accepted successfully', user: { id: user.id, email: user.email } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getInvitations = async (req: any, res: Response) => {
  try {
    const invitations = await prisma.invitation.findMany({
      where: {
        tenantId: req.user.tenantId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invitations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const resendInvitation = async (req: any, res: Response) => {
  const { id } = req.params;
  
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id, tenantId: req.user.tenantId },
      include: { tenant: true }
    });

    if (!invitation || invitation.status !== 'PENDING') {
      return res.status(404).json({ message: 'Pending invitation not found' });
    }

    const tenantName = invitation.tenant.name;
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${invitation.token}`;

    await commService.transporter.sendMail({
      from: process.env.EMAIL_FROM || '"CentraCRM" <no-reply@centracrm.com>',
      to: invitation.email,
      subject: `Invitation to join ${tenantName} on CentraCRM`,
      text: `You have been invited to join ${tenantName} on CentraCRM. Click the link to accept and set your password: ${inviteLink}`,
      html: `<p>You have been invited to join <strong>${tenantName}</strong> on CentraCRM.</p><p>Click the link below to accept and set your password:</p><a href="${inviteLink}">${inviteLink}</a>`
    });

    res.json({ message: 'Invitation resent successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
