import { Router, Request, Response, NextFunction } from 'express';
import lmsController from '../controllers/lms.controller';

const router = Router();

// A simple API Key middleware for external LMS integration
const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  const VALID_API_KEY = process.env.LMS_API_KEY || 'default-lms-secret-key';
  
  if (!apiKey || apiKey !== VALID_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized API Key' });
  }
  next();
};

router.post('/external', requireApiKey, lmsController.captureLMSLead);

export default router;
