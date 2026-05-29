import { Request, Response } from 'express';
import prisma from '../config/prisma';
import ConnectorCredentials, { invalidateConnectorCache } from '../utils/connectorCredentials';

export const getTenantConfig = async (req: any, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { config: true }
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const config = (tenant.config as any) || {};

    // Redact sensitive keys
    const redactedConfig = redactConfig(config);

    res.json({ config: redactedConfig, tenantId: req.tenantId });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTenantConfig = async (req: any, res: Response) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({ message: 'Config is required' });
    }

    // Merge with existing config to avoid overwriting everything
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { config: true }
    });

    const existingConfig = (existingTenant?.config as any) || {};
    
    // Process the incoming config to handle redacted keys
    const updatedConfig = mergeAndUnredactConfig(existingConfig, config);

    const updatedTenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { config: updatedConfig }
    });

    // Invalidate connector credential cache so updated keys take effect immediately
    invalidateConnectorCache(req.tenantId);

    res.json({ success: true, message: 'Configuration updated' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

const redactConfig = (config: any) => {
  const redacted = JSON.parse(JSON.stringify(config)); // Deep clone
  
  const sensitiveKeys = ['authToken', 'apiSecret', 'whatsappToken', 'keySecret', 'pass', 'accessToken', 'appSecret'];
  
  const traverseAndRedact = (obj: any) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        traverseAndRedact(obj[key]);
      } else if (sensitiveKeys.includes(key) && obj[key]) {
        obj[key] = '********';
      }
    }
  };
  
  traverseAndRedact(redacted);
  return redacted;
};

const mergeAndUnredactConfig = (existing: any, incoming: any) => {
  const merged = JSON.parse(JSON.stringify(existing)); // Start with existing
  
  const traverseAndMerge = (target: any, source: any) => {
    for (const key in source) {
      if (Array.isArray(source[key])) {
        target[key] = source[key];
      } else if (typeof source[key] === 'object' && source[key] !== null) {
        if (!target[key]) target[key] = {};
        traverseAndMerge(target[key], source[key]);
      } else {
        // If incoming value is redacted, keep the existing value
        if (source[key] === '********') {
          // Keep existing
        } else {
          target[key] = source[key];
        }
      }
    }
  };
  
  traverseAndMerge(merged, incoming);
  return merged;
};

export const getConnectorDefinitionsForTenant = async (req: Request, res: Response) => {
  try {
    const definitions = await (prisma as any).connectorDefinition.findMany();
    res.json(definitions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /tenant/connectors/status
 * Returns a status map of which connectors are configured for the tenant.
 * Does NOT expose credentials — only boolean configured flags and source (tenant or env).
 */
export const getConnectorStatus = async (req: any, res: Response) => {
  try {
    const statusMap = await ConnectorCredentials.getStatusMap(req.tenantId);
    res.json({ connectors: statusMap });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const testConnector = async (req: any, res: Response) => {
  try {
    const { type, config } = req.body;
    
    if (type === 'Twilio') {
      const { accountSid, authToken } = config;
      
      if (!accountSid || !authToken) {
        return res.status(400).json({ message: 'Account SID and Auth Token are required for Twilio.' });
      }
      
      const { Twilio } = require('twilio');
      const client = new Twilio(accountSid, authToken);
      
      // Attempt to fetch account info to verify keys
      await client.api.accounts(accountSid).fetch();
      
      return res.json({ success: true, message: 'Twilio credentials verified successfully!' });
    }
    
    if (type === 'Meta') {
      const { whatsappToken, phoneNumberId } = config;
      if (!whatsappToken || !phoneNumberId) {
        return res.status(400).json({ message: 'WhatsApp Token and Phone Number ID are required.' });
      }
      const axios = require('axios');
      try {
        await axios.get(`https://graph.facebook.com/v17.0/${phoneNumberId}`, {
          headers: { 'Authorization': `Bearer ${whatsappToken}` }
        });
        return res.json({ success: true, message: 'Meta credentials verified successfully!' });
      } catch (error: any) {
        return res.status(400).json({ message: `Meta verification failed: ${error.response?.data?.error?.message || error.message}` });
      }
    }

    if (type === 'SMTP') {
      const { host, port, user, pass, secure } = config;
      if (!host || !port || !user || !pass) {
        return res.status(400).json({ message: 'Host, Port, User, and Pass are required for SMTP.' });
      }
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: secure === 'true' || secure === true,
        auth: { user, pass }
      });
      try {
        await transporter.verify();
        return res.json({ success: true, message: 'SMTP credentials verified successfully!' });
      } catch (error: any) {
        return res.status(400).json({ message: `SMTP verification failed: ${error.message}` });
      }
    }

    if (type === 'Razorpay') {
      const { keyId, keySecret } = config;
      if (!keyId || !keySecret) {
        return res.status(400).json({ message: 'Key ID and Key Secret are required for Razorpay.' });
      }
      const Razorpay = require('razorpay');
      const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
      try {
        await instance.orders.all({ count: 1 });
        return res.json({ success: true, message: 'Razorpay credentials verified successfully!' });
      } catch (error: any) {
        return res.status(400).json({ message: `Razorpay verification failed: ${error.message}` });
      }
    }
    
    res.status(400).json({ message: `Verification not supported for ${type} yet.` });
  } catch (error: any) {
    res.status(400).json({ message: `Verification failed: ${error.message}` });
  }
};
