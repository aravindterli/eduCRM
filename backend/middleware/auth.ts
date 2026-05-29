import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import prisma from '../config/prisma';
import { Sector } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
  sector?: Sector;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1] || (req.query.token as string);

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: { 
      role: true,
      tenant: true
    },
  });

  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }

  req.user = user;
  req.tenantId = user.tenantId;
  req.sector = user.tenant?.sector || 'GENERIC';

  // Read-Only Mode for inactive tenants
  if (user.tenant && user.tenant.subscriptionStatus !== 'ACTIVE' && user.role.type !== 'SUPERADMIN') {
    if (req.method !== 'GET') {
      return res.status(403).json({ message: 'Account is inactive. Read-only mode active.' });
    }
  }

  next();
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const userRoleType = req.user.role.type;

    // 1. Super Admins and Admins are always authorized for everything
    if (userRoleType === 'SUPERADMIN' || userRoleType === 'ADMIN') {
      return next();
    }

    // 2. Standard users are authorized if standard or legacy roles are permitted
    const isStandardPermitted = roles.some(r => 
      ['STANDARDUSER', 'STANDARD', 'COUNSELOR', 'TELECALLER', 'MARKETING_TEAM', 'FINANCE'].includes(r)
    );

    if (userRoleType === 'STANDARDUSER' && isStandardPermitted) {
      return next();
    }

    // 3. Exact match check
    if (roles.includes(userRoleType)) {
      return next();
    }

    return res.status(403).json({ message: 'Unauthorized access' });
  };
};
