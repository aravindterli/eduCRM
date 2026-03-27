import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import prisma from '../config/prisma';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: { role: true },
  });

  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }

  req.user = user;
  next();
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role.type)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    next();
  };
};
