import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from '../routes/auth.routes';
import leadRoutes from '../routes/lead.routes';
import campaignRoutes from '../routes/campaign.routes';
import counselingRoutes from '../routes/counseling.routes';
import applicationRoutes from '../routes/application.routes';
import webinarRoutes from '../routes/webinar.routes';
import reportRoutes from '../routes/report.routes';
import financeRoutes from '../routes/finance.routes';
import programRoutes from '../routes/program.routes';
import lmsRoutes from '../routes/lms.routes';
import documentRoutes from '../routes/document.routes';
import templateRoutes from '../routes/template.routes';
import whatsappRoutes from '../routes/whatsapp.routes';

import { auditMiddleware } from '../middleware/audit';
import SchedulerService from '../services/scheduler.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(auditMiddleware);
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// API Routes v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/counseling', counselingRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/webinars', webinarRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/programs', programRoutes);
app.use('/api/v1/lms', lmsRoutes); // Added LMS routes
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);

app.get('/api/v1/ping', (req, res) => res.send('pong')); // Added ping endpoint

app.get('/health', (req, res) => {
  res.json({ status: 'UP', message: 'EduCRM API v1 is running', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 API Base Path: http://localhost:${PORT}/api/v1`);
  
  // Initialize Background Jobs
  SchedulerService.startAllJobs();
});

// Dev server reload trigger

