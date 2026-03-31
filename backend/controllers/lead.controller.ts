import { Request, Response } from 'express';
import LeadService from '../services/lead.service';
import CommunicationService from '../services/communication.service';
import prisma from '../config/prisma';

export const createLead = async (req: Request, res: Response) => {
  try {
    const lead = await LeadService.createLead(req.body);
    res.status(201).json(lead);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createPublicLead = async (req: Request, res: Response) => {
  try {
    const lead = await LeadService.handlePublicApplication(req.body);
    res.status(201).json(lead);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getLeads = async (req: Request, res: Response) => {
  try {
    const leads = await LeadService.getAllLeads(req.query);
    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeadDetail = async (req: Request, res: Response) => {
  try {
    const lead = await LeadService.getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addLeadNote = async (req: any, res: Response) => {
  try {
    const { content, type } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    const note = await LeadService.addNote(req.params.id, content, type, req.user.id);
    res.status(201).json(note);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const logLeadInteraction = async (req: any, res: Response) => {
  try {
    const { type, message, direction, duration, result } = req.body;
    if (!type || !message) return res.status(400).json({ message: 'Type and message are required' });
    const interaction = await LeadService.logInteraction(req.params.id, {
      type,
      message,
      direction: direction || 'OUTBOUND',
      duration: duration ? Number(duration) : undefined,
      result,
      counselorId: req.user.id
    });
    res.status(201).json(interaction);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const lead = await LeadService.updateLead(req.params.id, req.body);
    res.json(lead);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    await LeadService.deleteLead(req.params.id);
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getLeadStats = async (req: Request, res: Response) => {
  try {
    const stats = await LeadService.getLeadStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

import ImportService from '../services/import.service';

export const importLeads = async (req: Request, res: Response) => {
  try {
    const results = await ImportService.importLeadsFromCSV(req.body.leads);
    res.json(results);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const sendLeadTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.body;
    const lead = await LeadService.getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const template = await prisma.messageTemplate.findUnique({ where: { id: templateId } });
    if (!template) return res.status(404).json({ message: 'Template not found' });

    // Personalize template
    const messageContent = template.content.replace(/\${name}/g, lead.name);

    if (template.channel === 'WHATSAPP') {
      if (!lead.phone) return res.status(400).json({ message: 'Lead has no phone number' });
      await CommunicationService.sendWhatsApp(lead.phone, messageContent, lead.id);
    } else if (template.channel === 'SMS') {
      if (!lead.phone) return res.status(400).json({ message: 'Lead has no phone number' });
      await CommunicationService.sendSMS(lead.phone, messageContent, lead.id);
    } else if (template.channel === 'EMAIL') {
      if (!lead.email) return res.status(400).json({ message: 'Lead has no email' });
      await CommunicationService.sendEmail(lead.email, template.name, { name: lead.name, messageContent }, lead.id);
    }

    res.json({ success: true, message: 'Message queued for dispatch' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
export const reactivateLead = async (req: any, res: Response) => {
  try {
    const lead = await LeadService.reactivateLead(req.params.id, req.user.id);
    res.json(lead);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
