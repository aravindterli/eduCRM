import { Request, Response } from 'express';
import LeadService from '../services/lead.service';
import { z } from 'zod';

const lmsLeadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  location: z.string().optional(),
  eduBackground: z.string().optional(),
  qualification: z.string().optional(),
  interestedProgramId: z.string().optional(),
  leadSource: z.string(),
  campaignId: z.string().optional()
});

export class LMSController {
  async captureLMSLead(req: Request, res: Response) {
    try {
      const parsedData = lmsLeadSchema.parse(req.body);
      
      const lead = await LeadService.createLead(parsedData);
      
      res.status(201).json({
        message: 'Lead captured successfully from LMS',
        lead
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid lead data', details: error.errors });
      }
      res.status(500).json({ message: error.message || 'Error capturing LMS lead' });
    }
  }
}

export default new LMSController();
