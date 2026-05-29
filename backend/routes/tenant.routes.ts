import express from 'express';
import { getTenantConfig, updateTenantConfig, getConnectorDefinitionsForTenant, testConnector, getConnectorStatus } from '../controllers/tenant.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
// GET /config is accessible by STANDARDUSER (for custom stages/branding) as well as ADMIN/SUPERADMIN
router.get('/config', authorize(['ADMIN', 'SUPERADMIN', 'STANDARDUSER']), getTenantConfig);

// All other endpoints require ADMIN or SUPERADMIN privileges
router.put('/config', authorize(['ADMIN', 'SUPERADMIN']), updateTenantConfig);
router.get('/connector-definitions', authorize(['ADMIN', 'SUPERADMIN']), getConnectorDefinitionsForTenant);
router.get('/connectors/status', authorize(['ADMIN', 'SUPERADMIN', 'STANDARDUSER']), getConnectorStatus);
router.post('/connectors/test', authorize(['ADMIN', 'SUPERADMIN']), testConnector);

export default router;
