import express from 'express';
import { createServer } from 'http';
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
import notificationRoutes from '../routes/notification.routes';

import { auditMiddleware } from '../middleware/audit';
import SchedulerService from '../services/scheduler.service';
import { initSocket } from './config/socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'https://crm.thefoundrys.com',
  'https://thefoundrys.com',
  'http://localhost:3000',
  'http://localhost:5000'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const trimmedOrigin = origin.trim();
    if (allowedOrigins.indexOf(trimmedOrigin) !== -1 || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true
}));
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
app.use('/api/v1/notifications', notificationRoutes);

app.get('/api/v1/ping', (req, res) => res.send('pong')); // Added ping endpoint

app.get('/health', (req, res) => {
  res.json({ status: 'UP', message: 'CentraCRM API v1 is running', timestamp: new Date() });
});

// Meta requires a Privacy Policy URL
app.get('/privacy-policy', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Privacy Policy</title>
        <style>
          body { font-family: sans-serif; max-width: 800px; margin: 40px auto; line-height: 1.6; color: #333; }
          h1 { color: #1a73e8; }
        </style>
      </head>
      <body>
        <h1>Privacy Policy</h1>
        <p>Last updated: April 2026</p>
        <p>This privacy policy applies to our WhatsApp Business API integration and CRM applications.</p>
        <h2>1. Information we collect</h2>
        <p>We only collect the phone numbers and names necessary to provide educational consulting services.</p>
        <h2>2. How we use information</h2>
        <p>We use this information strictly to send requested updates, application statuses, and relevant promotional materials regarding our programs.</p>
        <h2>3. Third-party disclosure</h2>
        <p>We do not share your private data with third parties outside of Meta's communication infrastructure.</p>
        <h2>4. Contact</h2>
        <p>If you have questions about this policy, please contact our administrative team.</p>
      </body>
    </html>
  `);
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 API Base Path: http://localhost:${PORT}/api/v1`);
  
  // Initialize Socket.io
  initSocket(httpServer);
  
  // Initialize Background Jobs
  SchedulerService.startAllJobs();
});

// Dev server reload trigger

