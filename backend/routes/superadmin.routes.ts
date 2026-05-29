import { Router } from 'express';
import { 
  getAllTenants, 
  createTenant, 
  getTenantDetail,
  getSystemStats, 
  updateTenant, 
  getGlobalLeads, 
  getBillingSummary, 
  getFormTemplates, 
  createFormTemplate,
  getAnalytics,
  getConnectorDefinitions,
  createConnectorDefinition,
  updateConnectorDefinition,
  deleteConnectorDefinition
} from '../controllers/superadmin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All superadmin routes require authentication and SUPERADMIN role
router.use(authenticate);
router.use(authorize(['SUPERADMIN']));

router.get('/tenants', getAllTenants);
router.get('/tenants/:id', getTenantDetail);
router.post('/tenants', createTenant);
router.put('/tenants/:id', updateTenant);
router.get('/stats', getSystemStats);

// New Routes
router.get('/leads', getGlobalLeads);
router.get('/billing', getBillingSummary);
router.get('/forms', getFormTemplates);
router.post('/forms', createFormTemplate);
router.get('/analytics', getAnalytics);

// Connector Definitions
router.get('/connectors', getConnectorDefinitions);
router.post('/connectors', createConnectorDefinition);
router.put('/connectors/:id', updateConnectorDefinition);
router.delete('/connectors/:id', deleteConnectorDefinition);

export default router;
