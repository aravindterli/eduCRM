import { Router } from 'express';
import { 
  getLeadReports, 
  getCounselerStats, 
  getConversionFunnel, 
  getProgramPerformance, 
  getFinancialAnalytics,
  getRecentActivities,
  getMonthlyReport,
  downloadMonthlyPDF,
  downloadPaymentReceipt
} from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'MARKETING_TEAM', 'FINANCE']));

router.get('/leads', getLeadReports);
router.get('/counselors', getCounselerStats);
router.get('/funnel', getConversionFunnel);
router.get('/programs', getProgramPerformance);
router.get('/finance', getFinancialAnalytics);
router.get('/activities', getRecentActivities);
router.get('/monthly', getMonthlyReport);
router.get('/monthly/pdf', downloadMonthlyPDF);
router.get('/payments/:id/receipt', downloadPaymentReceipt);

export default router;
