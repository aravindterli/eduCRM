import { Request, Response } from 'express';
import axios from 'axios';
import prisma from '../config/prisma';

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await prisma.messageTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const wabaId = process.env.META_WABA_ID;
    const token = process.env.META_WHATSAPP_TOKEN;
    
    // Automatically overlay real-time Meta statuses if credentials exist
    if (wabaId && token) {
      try {
        const metaResponse = await axios.get(`https://graph.facebook.com/v17.0/${wabaId}/message_templates`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const metaTemplates = metaResponse.data.data || [];
        
        const enhancedTemplates = templates.map(t => {
          if (t.channel !== 'WHATSAPP') return t;
          const metaT = metaTemplates.find((m: any) => m.name === t.name);
          return { ...t, status: metaT ? metaT.status : 'UNKNOWN' };
        });
        return res.json(enhancedTemplates);
      } catch (err) {
        // Fallback to plain templates without crashing if meta fetch fails
        console.error('Failed to augment template statuses', err);
      }
    }

    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, content, channel } = req.body;
    let finalStatus = 'APPROVED';
    const formattedName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (channel === 'WHATSAPP') {
      const wabaId = process.env.META_WABA_ID;
      const token = process.env.META_WHATSAPP_TOKEN;

      if (!wabaId || !token) {
        return res.status(400).json({ message: 'WhatsApp credentials (WABA_ID, TOKEN) are not set up in backend .env' });
      }

      // Convert local variables ${name} etc. into Meta format {{1}}, {{2}} if needed, but for now we just pass it
      // Note: Meta rejects unsupported variable formats like ${name}.
      // We'll strip ${} if there are any to prevent hard crash, as user might not know better.
      const safeContent = content.replace(/\${.*?}/g, '');

      try {
        await axios.post(`https://graph.facebook.com/v17.0/${wabaId}/message_templates`, {
          name: formattedName,
          category: 'MARKETING',
          language: 'en_US',
          components: [
            { type: 'BODY', text: safeContent }
          ]
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        finalStatus = 'PENDING';
      } catch (err: any) {
        throw err;
      }
    }

    const template = await prisma.messageTemplate.create({
      data: { name: formattedName, content, channel }
    });
    // Send the dynamic status securely back to frontend memory instead of DB
    res.status(201).json({ ...template, status: finalStatus });
  } catch (error: any) {
    const metaError = error.response?.data?.error;
    console.error('[Template Create ERROR]', metaError || error.message);
    
    // Check if Meta provided specific details
    const specificDetail = metaError?.error_data?.details || metaError?.error_user_msg;
    const finalMsg = specificDetail 
        ? `Meta API Error: ${specificDetail}` 
        : (metaError?.message || error.message || 'Internal Server Error');
        
    res.status(500).json({ message: finalMsg });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, content, channel } = req.body;
    const template = await prisma.messageTemplate.update({
      where: { id },
      data: { name, content, channel }
    });
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.messageTemplate.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const syncWhatsAppTemplates = async (req: Request, res: Response) => {
  try {
    const wabaId = process.env.META_WABA_ID || req.body.wabaId;
    const token = process.env.META_WHATSAPP_TOKEN;

    if (!wabaId || !token) {
      return res.status(400).json({ 
        message: 'WhatsApp Business Account ID and Token are required for syncing. Please add META_WABA_ID to your .env file or provide wabaId in the request body.' 
      });
    }

    // Fetch from Meta
    const response = await axios.get(`https://graph.facebook.com/v17.0/${wabaId}/message_templates`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const metaTemplates = response.data.data || [];
    let importedCount = 0;
    let updatedCount = 0;

    for (const mt of metaTemplates) {
      let content = `[Meta Template: ${mt.name}]\n`;
      const bodyComponent = mt.components?.find((c: any) => c.type === 'BODY');
      if (bodyComponent) content += bodyComponent.text;

      const existing = await prisma.messageTemplate.findFirst({
        where: { name: mt.name, channel: 'WHATSAPP' }
      });

      if (!existing) {
        await prisma.messageTemplate.create({
          data: {
            name: mt.name,
            content: content,
            channel: 'WHATSAPP'
          }
        });
        importedCount++;
      } else {
        await prisma.messageTemplate.update({
          where: { id: existing.id },
          data: { content: content }
        });
        updatedCount++;
      }
    }

    // Now return all mapped with their live status!
    const allTemplates = await prisma.messageTemplate.findMany({ orderBy: { createdAt: 'desc' } });
    const mappedWithStatus = allTemplates.map(t => {
      if (t.channel !== 'WHATSAPP') return t;
      const metaT = metaTemplates.find((m: any) => m.name === t.name);
      return { ...t, status: metaT ? metaT.status : 'APPROVED' };
    });

    res.json({ 
      success: true, 
      message: `Successfully synced ${importedCount} new templates and updated ${updatedCount} records.`,
      templates: mappedWithStatus
    });

  } catch (error: any) {
    const details = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error('[WhatsApp Sync]', details);
    res.status(500).json({ message: 'Failed to sync templates from Meta', details });
  }
};
