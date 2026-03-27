import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role.type });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.type,
        theme: user.theme,
        accent: user.accent,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password, roleType } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const role = await prisma.role.findUnique({ where: { type: roleType } });

    if (!role) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId: role.id,
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

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
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
      include: { role: true }
    });

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role.type,
      theme: updatedUser.theme,
      accent: updatedUser.accent,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
