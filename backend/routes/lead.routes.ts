import { Router } from 'express';
import { createLead, getLeads, getLeadDetail, updateLead, getLeadStats, importLeads, addLeadNote, sendLeadTemplate } from '../controllers/lead.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'MARKETING_TEAM', 'TELECALLER', 'COUNSELOR']));

router.post('/', createLead);
router.get('/stats', getLeadStats);
router.post('/import', importLeads);
router.get('/', getLeads);
router.post('/:id/follow-up', (req: any, res) => {
  const FollowUpService = require('../services/followUp.service').default;
  FollowUpService.createFollowUp(req.params.id, req.body, req.user.id)
    .then((data: any) => res.json(data))
    .catch((err: any) => res.status(400).json({ message: err.message }));
});
router.post('/:id/notes', addLeadNote);
router.patch('/:id/stage', updateLead); // Re-using updateLead for stage update
router.patch('/:id', updateLead);
router.post('/:id/send-template', sendLeadTemplate);

export default router;
