import { Request, Response } from 'express';
import LeadService from '../services/lead.service';
import CommunicationService from '../services/communication.service';
import twilio from 'twilio';
import prisma from '../config/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import TenantService from '../services/tenant.service';
import ConnectorCredentials from '../utils/connectorCredentials';
import { ConnectorNotConfiguredError } from '../utils/connectorError';

export const getLeadFormStructure = async (req: any, res: Response) => {
  try {
    const template = await TenantService.getActiveFormTemplate(req.tenantId, req.sector);
    res.json(template || null);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createLead = async (req: any, res: Response) => {
  try {
    const lead = await LeadService.createLead(req.tenantId, req.body);
    res.status(201).json(lead);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createPublicLead = async (req: Request, res: Response) => {
  try {
    const { tenantId, ...leadData } = req.body;
    if (!tenantId) return res.status(400).json({ message: 'tenantId is required for public applications' });
    const result = await LeadService.handlePublicApplication(tenantId, leadData);
    res.status(201).json({
      success: true,
      leadId: result.lead.id,
      applicationId: result.applicationId,
      lead: result.lead
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getLeads = async (req: any, res: Response) => {
  try {
    const { page, limit, stage, assignedId, tag, sortBy, sortOrder, name, email } = req.query;
    const result = await LeadService.getAllLeads(req.tenantId, {
      page,
      limit,
      stage,
      assignedId,
      tag,
      sortBy,
      sortOrder,
      name,
      email
    }, req.user);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeadDetail = async (req: any, res: Response) => {
  try {
    const lead = await LeadService.getLeadById(req.tenantId, req.params.id);
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
    const note = await LeadService.addNote(req.tenantId, req.params.id, content, type, req.user.id);
    res.status(201).json(note);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const logLeadInteraction = async (req: any, res: Response) => {
  try {
    const { type, message, direction, duration, result } = req.body;
    if (!type || !message) return res.status(400).json({ message: 'Type and message are required' });
    const interaction = await LeadService.logInteraction(req.tenantId, req.params.id, {
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

export const updateLead = async (req: any, res: Response) => {
  try {
    const lead = await LeadService.updateLead(req.tenantId, req.params.id, req.body, req.user?.id);
    res.json(lead);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteLead = async (req: any, res: Response) => {
  try {
    await LeadService.deleteLead(req.tenantId, req.params.id);
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getLeadStats = async (req: any, res: Response) => {
  try {
    const stats = await LeadService.getLeadStats(req.tenantId, req.user?.id, req.user?.role?.type);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

import ImportService from '../services/import.service';
import MetaService from '../services/meta.service';

export const importLeads = async (req: any, res: Response) => {
  try {
    const results = await ImportService.importLeadsFromCSV(req.tenantId, req.body.leads);
    res.json(results);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const sendLeadTemplate = async (req: any, res: Response) => {
  try {
    const { templateId } = req.body;
    const lead = await LeadService.getLeadById(req.tenantId, req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const template = await prisma.messageTemplate.findFirst({ 
      where: { id: templateId, tenantId: req.tenantId } 
    });
    if (!template) return res.status(404).json({ message: 'Template not found' });

    // Personalize template
    const messageContent = template.content.replace(/\${name}/g, lead.name);

    if (template.channel === 'WHATSAPP') {
      if (!lead.phone) return res.status(400).json({ message: 'Lead has no phone number' });
      await CommunicationService.sendWhatsApp(req.tenantId, lead.phone, messageContent, lead.id, undefined, template.name);
    } else if (template.channel === 'SMS') {
      if (!lead.phone) return res.status(400).json({ message: 'Lead has no phone number' });
      await CommunicationService.sendSMS(req.tenantId, lead.phone, messageContent, lead.id);
    } else if (template.channel === 'EMAIL') {
      if (!lead.email) return res.status(400).json({ message: 'Lead has no email' });
      await CommunicationService.sendEmail(req.tenantId, lead.email, template.name, { name: lead.name, messageContent }, lead.id);
    }

    res.json({ success: true, message: 'Message queued for dispatch' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkSendWhatsApp = async (req: any, res: Response) => {
  try {
    const { leadIds, message, imageUrl, templateName } = req.body;
    if (!leadIds || !Array.isArray(leadIds) || (!message && !templateName)) {
      return res.status(400).json({ message: 'Lead IDs and message are required' });
    }

    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds }, tenantId: req.tenantId }
    });

    const results = [];
    for (const lead of leads) {
      if (!lead.phone) {
        results.push({ leadId: lead.id, name: lead.name, success: false, error: 'No phone number' });
        continue;
      }

      const personalizedMessage = message ? message.replace(/\${name}/g, lead.name) : '';

      try {
        await CommunicationService.sendWhatsApp(req.tenantId, lead.phone, personalizedMessage, lead.id, imageUrl, templateName);
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
    const lead = await LeadService.reactivateLead(req.tenantId, req.params.id, req.user.id);
    res.json(lead);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const googleAdsWebhook = async (req: Request, res: Response) => {
  try {
    const { user_column_data, google_key, tenantId } = req.body;

    // 1. Security check — verify against tenant-specific key if tenantId provided, else global env
    let expectedKey = process.env.GOOGLE_ADS_WEBHOOK_KEY || '';
    if (tenantId) {
      try {
        const creds = await ConnectorCredentials.getGoogleAds(tenantId);
        expectedKey = creds.webhookKey;
      } catch (_) { /* fall back to env key */ }
    }

    if (!expectedKey || google_key !== expectedKey) {
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

    res.status(201).json({ success: true, lead_id: lead.lead.id, campaign: campaign?.name || null });
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

export const getLeadMessages = async (req: any, res: Response) => {
  try {
    const messages = await prisma.communicationLog.findMany({
      where: {
        tenantId: req.tenantId,
        leadId: req.params.id,
        type: { in: ['SMS', 'WHATSAPP', 'RCS'] }
      },
      orderBy: { timestamp: 'desc' }
    });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const sendLeadMessage = async (req: any, res: Response) => {
  try {
    const { message, channel } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });
    
    const lead = await LeadService.getLeadById(req.tenantId, req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    if (!lead.phone) return res.status(400).json({ message: 'Lead has no phone number' });

    let result;
    if (channel === 'WHATSAPP') {
      result = await CommunicationService.sendWhatsApp(req.tenantId, lead.phone, message, lead.id);
    } else {
      result = await CommunicationService.sendSMS(req.tenantId, lead.phone, message, lead.id);
    }

    if (result.success) {
      res.json({ success: true, message: 'Message sent' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeadCalls = async (req: any, res: Response) => {
  try {
    const calls = await prisma.communicationLog.findMany({
      where: {
        tenantId: req.tenantId,
        leadId: req.params.id,
        type: 'CALL'
      },
      orderBy: { timestamp: 'desc' }
    });
    res.json(calls);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const initiateLeadCall = async (req: any, res: Response) => {
  try {
    const { duration, result: callResult } = req.body;
    
    const lead = await LeadService.getLeadById(req.tenantId, req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    // Simulate call by logging it
    const interaction = await LeadService.logInteraction(req.tenantId, req.params.id, {
      type: 'CALL',
      message: `Call with ${lead.name}`,
      direction: 'OUTBOUND',
      duration: duration ? Number(duration) : undefined,
      result: callResult || 'CONNECTED',
      assignedId: req.user.id
    });

    res.status(201).json(interaction);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTwilioToken = async (req: any, res: Response) => {
  try {
    const creds = await ConnectorCredentials.getTwilio(req.tenantId);

    if (!creds.apiKey || !creds.apiSecret) {
      return res.status(422).json({
        code: 'CONNECTOR_NOT_CONFIGURED',
        connector: 'Twilio',
        message: 'Please configure your Twilio API Key and API Secret in Settings → Connectors to enable browser calling.'
      });
    }

    const identity = req.user.id;
    const token = new twilio.jwt.AccessToken(
      creds.accountSid,
      creds.apiKey,
      creds.apiSecret,
      { identity: identity }
    );

    const grant = new twilio.jwt.AccessToken.VoiceGrant({
      outgoingApplicationSid: creds.twimlAppSid,
      incomingAllow: true
    });
    token.addGrant(grant);

    res.json({ token: token.toJwt() });
  } catch (error: any) {
    if (error instanceof ConnectorNotConfiguredError) {
      return res.status(422).json({
        code: 'CONNECTOR_NOT_CONFIGURED',
        connector: error.connector,
        message: error.message
      });
    }
    res.status(500).json({ message: error.message });
  }
};

export const handleTwilioVoice = async (req: any, res: Response) => {
  console.log('[Twilio Voice] Received request:', req.body);
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  const to = req.body.To;
  const userId = req.body.UserId;

  if (to) {
    // Resolve caller ID from tenant config
    let callerPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
    try {
      if (req.tenantId) {
        const creds = await ConnectorCredentials.getTwilio(req.tenantId);
        callerPhoneNumber = creds.phoneNumber;
      }
    } catch (_) { /* fall back to env */ }

    const dial = response.dial({ callerId: callerPhoneNumber });
    dial.number({
      statusCallbackEvent: 'answered completed',
      statusCallback: `${process.env.BACKEND_URL}/api/v1/leads/twilio/status?userId=${userId}`,
      statusCallbackMethod: 'POST'
    }, to);
  } else {
    response.say('No destination provided.');
  }

  res.type('text/xml');
  res.send(response.toString());
};

export const handleTwilioStatus = async (req: Request, res: Response) => {
  const { userId } = req.query;
  const { CallStatus } = req.body;
  
  console.log(`[Twilio Status] Call status for user ${userId}:`, CallStatus);
  
  if (userId) {
    const { emitToUser } = require('../src/config/socket');
    emitToUser(userId as string, 'twilio:callStatus', { status: CallStatus });
  }
  
  res.sendStatus(200);
};
