import { Request, Response } from 'express';
import CampaignService from '../services/campaign.service';
import * as xlsx from 'xlsx';
import CommunicationService from '../services/communication.service';
import fs from 'fs';
import path from 'path';

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const campaign = await CampaignService.createCampaign(req.body);
    res.status(201).json(campaign);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getROI = async (req: Request, res: Response) => {
  try {
    const roi = await CampaignService.getCampaignROI();
    res.json(roi);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const campaign = await CampaignService.updateCampaign(req.params.id, req.body);
    res.json(campaign);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    await CampaignService.deleteCampaign(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const handleBulkBroadcast = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No excel file uploaded' });
    }

    const { templateName, imageUrl, sendWhatsApp, sendEmail, emailSubject, emailContent } = req.body;

    const shouldSendWhatsApp = sendWhatsApp === 'true';
    const shouldSendEmail = sendEmail === 'true';

    if (!shouldSendWhatsApp && !shouldSendEmail) {
      return res.status(400).json({ message: 'Must select at least WhatsApp or Email' });
    }

    // Read Excel File
    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<any>(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const results = {
      totalRows: rows.length,
      whatsappSuccess: 0,
      whatsappFailed: 0,
      emailSuccess: 0,
      emailFailed: 0,
      successes: [] as { type: string, phone?: string, email?: string }[],
      errors: [] as any[]
    };

    // Iterate through rows and send messages
    for (const [index, row] of rows.entries()) {
      const phone = row['Phone'] || row['phone'] || row['PhoneNumber'] || row['Contact'];
      const email = row['Email'] || row['email'] || row['EmailAddress'];
      const name = row['Name'] || row['name'] || 'User';

      if (shouldSendWhatsApp) {
        if (phone) {
          try {
            await CommunicationService.sendWhatsApp(
              String(phone), 
              '', // No custom message
              undefined, 
              imageUrl || undefined, 
              templateName
            );
            results.whatsappSuccess++;
            results.successes.push({ type: 'WhatsApp', phone });
          } catch (err: any) {
            results.whatsappFailed++;
            results.errors.push({ row: index + 2, type: 'WhatsApp', phone, error: err.message });
          }
        } else {
          results.whatsappFailed++;
          results.errors.push({ row: index + 2, type: 'WhatsApp', error: 'Missing Phone Number' });
        }
      }

      if (shouldSendEmail) {
        if (email) {
          try {
            let personalizedContent = emailContent ? emailContent.replace(/\${name}/g, name) : `Hello ${name}, welcome specifically to our campaign!`;
            let attachments: any[] = [];

            if (imageUrl) {
               // Robust fallback: if ngrok blocks external requests, we embed it natively via CID since it exists on our disk!
               let localPath = '';
               try {
                 const urlObj = new URL(imageUrl);
                 if (urlObj.pathname.startsWith('/uploads/')) {
                   localPath = path.join(__dirname, '../../', urlObj.pathname);
                 }
               } catch (e) {}

               if (localPath && fs.existsSync(localPath)) {
                 personalizedContent = `<img src="cid:campaign_header" style="max-width:100%; border-radius:8px; margin-bottom:15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" /><br/>` + personalizedContent;
                 attachments.push({
                   filename: path.basename(localPath),
                   path: localPath,
                   cid: 'campaign_header'
                 });
               } else {
                 personalizedContent = `<img src="${imageUrl}" style="max-width:100%; border-radius:8px; margin-bottom:15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" /><br/>` + personalizedContent;
               }
            }

            const html = CommunicationService.getBaseTemplate(emailSubject || 'Special Announcement', personalizedContent);
            
            await CommunicationService.transporter.sendMail({
              from: process.env.EMAIL_FROM || '"CentraCRM Admissions" <no-reply@centracrm.com>',
              to: String(email),
              subject: emailSubject || 'Special Announcement',
              html,
              attachments: attachments.length > 0 ? attachments : undefined
            });
            results.emailSuccess++;
            results.successes.push({ type: 'Email', email });
          } catch (err: any) {
            results.emailFailed++;
            results.errors.push({ row: index + 2, type: 'Email', email, error: err.message });
          }
        } else {
          results.emailFailed++;
          results.errors.push({ row: index + 2, type: 'Email', error: 'Missing Email Address' });
        }
      }
    }

    // Store the broadcast result in the AuditLog for persistent reference
    try {
      const AuditService = (await import('../services/audit.service')).default;
      const userReq = req as any;
      await AuditService.log('BULK_BROADCAST', userReq.user?.id || 'system', {
        templateName,
        emailSubject,
        emailContent, // Log email content to view history
        imageUrl,     // Log image URL to view history
        totalRows: results.totalRows,
        whatsappSuccess: results.whatsappSuccess,
        emailSuccess: results.emailSuccess,
        successes: results.successes,
        errors: results.errors
      });
    } catch (e) {
      console.error('Failed to log broadcast to AuditLog', e);
    }

    try { fs.unlinkSync(file.path); } catch (e) {}
    return res.status(200).json({ success: true, results });

  } catch (error: any) {
    console.error('[BulkBroadcast]', error);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch(e){}
    }
    return res.status(500).json({ message: 'Internal Server Error during broadcast' });
  }
};

export const getBroadcastHistory = async (req: Request, res: Response) => {
  try {
    const prisma = (await import('../config/prisma')).default;
    const history = await prisma.auditLog.findMany({
      where: { action: 'BULK_BROADCAST' },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
