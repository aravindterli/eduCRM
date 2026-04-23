import { Request, Response } from 'express';
import LeadService from '../services/lead.service';
import CommunicationService from '../services/communication.service';
import prisma from '../config/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

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
    const { page, limit, stage, assignedId, tag } = req.query;
    const result = await LeadService.getAllLeads({
      page,
      limit,
      stage,
      assignedId,
      tag
    }, (req as any).user);
    res.json(result);
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
      assignedId: req.user.id
    });
    res.status(201).json(interaction);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const lead = await LeadService.updateLead(req.params.id, req.body, (req as any).user?.id);
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

export const getLeadStats = async (req: any, res: Response) => {
  try {
    const stats = await LeadService.getLeadStats(req.user?.id, req.user?.role);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

import ImportService from '../services/import.service';
import MetaService from '../services/meta.service';

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
      await CommunicationService.sendWhatsApp(lead.phone, messageContent, lead.id, undefined, template.name);
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

export const bulkSendWhatsApp = async (req: Request, res: Response) => {
  try {
    const { leadIds, message, imageUrl, templateName } = req.body;
    if (!leadIds || !Array.isArray(leadIds) || (!message && !templateName)) {
      return res.status(400).json({ message: 'Lead IDs and message are required' });
    }

    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds } }
    });

    const results = [];
    for (const lead of leads) {
      if (!lead.phone) {
        results.push({ leadId: lead.id, name: lead.name, success: false, error: 'No phone number' });
        continue;
      }

      // Personalize message if ${name} is present
      const personalizedMessage = message ? message.replace(/\${name}/g, lead.name) : '';

      try {
        await CommunicationService.sendWhatsApp(lead.phone, personalizedMessage, lead.id, imageUrl, templateName);
        results.push({ leadId: lead.id, name: lead.name, success: true });
      } catch (error: any) {
        results.push({ leadId: lead.id, name: lead.name, success: false, error: error.message });
      }
    }

    res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// WhatsApp Media Upload Configuration
const whatsappUploadDir = path.join(__dirname, '../../uploads/whatsapp');
if (!fs.existsSync(whatsappUploadDir)) {
  fs.mkdirSync(whatsappUploadDir, { recursive: true });
}

const whatsappStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, whatsappUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'wa-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const whatsappMediaUpload = multer({
  storage: whatsappStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP and GIF are allowed.'));
    }
  }
});

export const uploadWhatsAppMedia = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Construct the public URL for the image
    // Note: In production, this should be the full domain URL
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/whatsapp/${req.file.filename}`;

    res.status(201).json({
      success: true,
      url: imageUrl,
      filename: req.file.filename
    });
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

export const googleAdsWebhook = async (req: Request, res: Response) => {
  try {
    const { user_column_data, google_key } = req.body;

    // 1. Security check
    if (google_key !== process.env.GOOGLE_ADS_WEBHOOK_KEY) {
      return res.status(401).json({ message: 'Invalid Google Key' });
    }

    // 2. Parse data
    const leadData: any = {
      leadSource: 'Google Ads'
    };

    user_column_data.forEach((field: any) => {
      if (field.column_id === 'FULL_NAME') leadData.name = field.string_value;
      if (field.column_id === 'PHONE_NUMBER') leadData.phone = field.string_value;
      if (field.column_id === 'EMAIL') leadData.email = field.string_value;
      if (field.column_id === 'CITY' || field.column_id === 'POSTAL_CODE') leadData.location = field.string_value;
      if (field.column_id === 'QUALIFICATION') leadData.qualification = field.string_value;
    });

    if (!leadData.phone || !leadData.name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 3. Auto-link to the latest active Google Ads campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        source: { contains: 'Google', mode: 'insensitive' },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    if (campaign) leadData.campaignId = campaign.id;

    // 4. Process lead
    const lead = await LeadService.handlePublicApplication(leadData);

    res.status(201).json({ success: true, lead_id: lead.id, campaign: campaign?.name || null });
  } catch (error: any) {
    console.error('Google Ads Webhook Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const metaWebhook = async (req: Request, res: Response) => {
  console.log('[MetaWebhook] Incoming Request:', {
    method: req.method,
    query: req.query,
    body: JSON.stringify(req.body, null, 2),
    headers: req.headers['x-hub-signature-256'] ? 'Present' : 'Missing'
  });

  // Handle GET verification (handshake)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }

  // Handle POST notification
  try {
    const entries = req.body.entry;
    if (!entries) return res.sendStatus(400);

    for (const entry of entries) {
      for (const change of entry.changes) {
        if (change.field === 'leadgen') {
          const leadgenId = change.value.leadgen_id;

          // Fetch full lead data from Meta Graph API
          const fbData = await MetaService.fetchLeadData(leadgenId);

          // Process and save lead
          await MetaService.processLead(fbData);
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Meta Webhook Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const subscribeToMetaPage = async (req: Request, res: Response) => {
  try {
    const { pageId } = req.body;
    if (!pageId) return res.status(400).json({ message: 'pageId is required' });

    console.log(`[MetaWebhook] Subscribing app to Page ID: ${pageId}`);
    const result = await MetaService.subscribePage(pageId);

    res.status(200).json({
      success: true,
      message: 'Successfully subscribed to Page leadgen field',
      meta_response: result
    });
  } catch (error: any) {
    console.error('Meta Subscription Error:', error.response?.data || error.message);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const syncMetaLeads = async (req: Request, res: Response) => {
  try {
    const { formId } = req.body;
    if (!formId) return res.status(400).json({ message: 'formId is required' });

    console.log(`[MetaSync] Starting manual sync for Form ID: ${formId}`);

    const response = await MetaService.fetchHistoricalLeads(formId);
    const leads = response.data;

    if (!leads || !Array.isArray(leads)) {
      return res.status(200).json({ success: true, count: 0, message: 'No leads found' });
    }

    let successCount = 0;
    for (const lead of leads) {
      try {
        const processed = await MetaService.processLead(lead);
        if (processed) successCount++;
      } catch (err) {
        console.error(`[MetaSync] Failed to process lead ${lead.id}:`, err);
      }
    }

    res.json({
      success: true,
      count: successCount,
      totalFound: leads.length,
      message: `Successfully synced ${successCount} out of ${leads.length} leads.`
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMetaPages = async (req: Request, res: Response) => {
  try {
    const data = await MetaService.fetchUserPages();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMetaForms = async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;
    const data = await MetaService.fetchLeadForms(pageId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
