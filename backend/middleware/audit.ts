import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

export const auditMiddleware = async (req: any, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  // Override res.json to catch the response and log after success
  res.json = function (body: any) {
    res.locals.responseBody = body;
    return originalJson.call(this, body);
  };

  res.on('finish', async () => {
    const isStateChanging = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method);
    const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

    if (isStateChanging && isSuccess) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: req.user?.id || null,
            action: `${req.method} ${req.originalUrl}`,
            details: {
              requestBody: req.body,
              responseBody: res.locals.responseBody,
              ip: req.ip,
            },
          },
        });
      } catch (error) {
        console.error('Audit Log Error:', error);
      }
    }
  });

  next();
};
