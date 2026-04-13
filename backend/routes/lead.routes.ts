import express, { Router } from 'express';
import { createLead, createPublicLead, getLeads, getLeadDetail, updateLead, deleteLead, getLeadStats, importLeads, addLeadNote, logLeadInteraction, sendLeadTemplate, reactivateLead, bulkSendWhatsApp, whatsappMediaUpload, uploadWhatsAppMedia } from '../controllers/lead.controller';
import { authenticate, authorize } from '../middleware/auth';
import path from 'path';

const router = Router();

// Public routes for student enquiry/application
router.post('/public', createPublicLead);

router.use(authenticate);
router.use('/uploads/whatsapp', express.static(path.join(__dirname, '../../uploads/whatsapp')));
router.use(authorize(['ADMIN', 'MARKETING_TEAM', 'TELECALLER', 'COUNSELOR']));

router.post('/', createLead);
router.get('/stats', getLeadStats);
router.post('/import', importLeads);
router.post('/bulk-whatsapp', bulkSendWhatsApp);
router.post('/upload-media', whatsappMediaUpload.single('file'), uploadWhatsAppMedia);
router.get('/', getLeads);

// ── global follow-up routes (must be before /:id wildcard) ──────────────────
router.get('/follow-ups/upcoming', async (_req, res) => {
  const FollowUpService = require('../services/followUp.service').default;
  try {
    const data = await FollowUpService.getUpcomingFollowUps();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/follow-ups/:id/complete', async (req, res) => {
  const FollowUpService = require('../services/followUp.service').default;
  try {
    const data = await FollowUpService.completeFollowUp(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/follow-ups/:id', async (req, res) => {
  const FollowUpService = require('../services/followUp.service').default;
  try {
    const data = await FollowUpService.updateFollowUp(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// ── per-lead routes ──────────────────────────────────────────────────────────
router.get('/:id/follow-ups', async (req, res) => {
  const FollowUpService = require('../services/followUp.service').default;
  try {
    const data = await FollowUpService.getFollowUpsByLead(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/follow-up', async (req: any, res) => {
  const FollowUpService = require('../services/followUp.service').default;
  try {
    const data = await FollowUpService.createFollowUp(req.params.id, req.body, req.user.id);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/:id/notes', addLeadNote);
router.post('/:id/log-interaction', logLeadInteraction);
router.patch('/:id/stage', updateLead);
router.patch('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/:id/send-template', sendLeadTemplate);

router.post('/:id/reactivate', authenticate, reactivateLead);

export default router;
