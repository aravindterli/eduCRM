import axios from 'axios';
import LeadService from './lead.service';
import prisma from '../config/prisma';

export class MetaService {
  private readonly version = 'v19.0';
  private readonly baseUrl = 'https://graph.facebook.com';

  /**
   * Fetches full lead data from Meta Graph API using leadgen_id
   */
  async fetchLeadData(leadgenId: string) {
    const accessToken = process.env.META_ACCESS_TOKEN;
    if (!accessToken) throw new Error('META_ACCESS_TOKEN not configured');

    try {
      const response = await axios.get(`${this.baseUrl}/${this.version}/${leadgenId}`, {
        params: { access_token: accessToken }
      });
      return response.data;
    } catch (error: any) {
      console.error('[MetaService] Error fetching lead data:', error.response?.data || error.message);
      if (error.response?.data) {
        throw new Error(`Meta API Error: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Fetches historical leads from a specific Meta Form ID
   */
  async fetchHistoricalLeads(formId: string) {
    const accessToken = process.env.META_ACCESS_TOKEN;
    if (!accessToken) throw new Error('META_ACCESS_TOKEN not configured');

    try {
      const response = await axios.get(`${this.baseUrl}/${this.version}/${formId}/leads`, {
        params: { access_token: accessToken, limit: 100 }
      });
      return response.data;
    } catch (error: any) {
      console.error('[MetaService] Error fetching historical leads:', error.response?.data || error.message);
      if (error.response?.data) {
        throw new Error(`Meta API Error: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Fetches all pages the user has access to
   */
  async fetchUserPages() {
    const accessToken = process.env.META_ACCESS_TOKEN;
    if (!accessToken) throw new Error('META_ACCESS_TOKEN not configured');

    try {
      const response = await axios.get(`${this.baseUrl}/${this.version}/me/accounts`, {
        params: { access_token: accessToken }
      });
      return response.data;
    } catch (error: any) {
      console.error('[MetaService] Error fetching user pages:', error.response?.data || error.message);
      throw new Error(`Meta Discovery Error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  }

  /**
   * Fetches lead gen forms for a specific page
   */
  async fetchLeadForms(pageId: string) {
    const accessToken = process.env.META_ACCESS_TOKEN;
    if (!accessToken) throw new Error('META_ACCESS_TOKEN not configured');

    try {
      const response = await axios.get(`${this.baseUrl}/${this.version}/${pageId}/leadgen_forms`, {
        params: { access_token: accessToken }
      });
      return response.data;
    } catch (error: any) {
      console.error('[MetaService] Error fetching lead forms:', error.response?.data || error.message);
      throw new Error(`Meta Discovery Error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  }

  /**
   * Maps Meta field_data to CRM Lead fields and processes the ingestion
   */
  async processLead(fbData: any) {
    const leadData: any = {
      leadSource: 'Meta (FB/Insta)'
    };

    if (!fbData.field_data || !Array.isArray(fbData.field_data)) {
      console.warn('[MetaService] Received FB data with no field_data');
      return null;
    }

    // Map Meta field_data to Lead fields
    fbData.field_data.forEach((field: any) => {
      const name = field.name.toLowerCase();
      const value = field.values[0];

      if (name.includes('full_name') || name === 'name' || name === 'fullname') leadData.name = value;
      if (name.includes('phone') || name === 'phone_number') leadData.phone = value;
      if (name.includes('email')) leadData.email = value;
      if (name === 'city' || name === 'location') leadData.location = value;
      if (name === 'qualification') leadData.qualification = value;
    });

    if (!leadData.phone || !leadData.name) {
      console.warn('[MetaService] Lead data missing required fields:', leadData);
      return null;
    }

    // NOTE: Auto-linking to campaigns is currently disabled due to a schema mismatch error
    // (Prisma expects 'externalId' which is not present in the current Campaign model).
    /*
    const campaign = await prisma.campaign.findFirst({
      where: {
        source: { in: ['Facebook', 'Instagram', 'Meta'], mode: 'insensitive' },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }]
      },
      orderBy: { createdAt: 'desc' }
    });
    if (campaign) leadData.campaignId = campaign.id;
    */

    // Use LeadService to handle ingestion (duplicates + auto-assignment)
    return await LeadService.handlePublicApplication(leadData);
  }

  /**
   * Subscribes the App to a Page's leadgen notifications
   * This is REQUIRED for webhooks to start flowing
   */
  async subscribePage(pageId: string) {
    const accessToken = process.env.META_ACCESS_TOKEN;
    if (!accessToken) throw new Error('META_ACCESS_TOKEN not configured');

    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.version}/${pageId}/subscribed_apps`,
        null,
        {
          params: {
            access_token: accessToken,
            subscribed_fields: 'leadgen'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('[MetaService] Error subscribing to page:', error.response?.data || error.message);
      throw new Error(`Meta Subscription Error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  }

  /**
   * Periodically syncs leads from all forms associated with the configured Page.
   * This serves as a robust fallback to the real-time webhook.
   */
  async syncRecentLeads() {
    const pageId = process.env.META_PAGE_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!pageId || !accessToken) {
      console.error('[MetaService] Sync failed: META_PAGE_ID or META_ACCESS_TOKEN not configured');
      return;
    }

    console.log(`[MetaService] Starting lead sync for Page: ${pageId}`);

    try {
      // 1. Get all forms for the page
      const forms = await this.fetchLeadForms(pageId);
      const formList = forms.data || [];
      console.log(`[MetaService] Found ${formList.length} active forms to sync.`);

      // Calculate the "since" timestamp (last 4 hours to be safe)
      const fourHoursAgo = Math.floor((Date.now() - 4 * 60 * 60 * 1000) / 1000);
      let totalSynced = 0;

      // 2. Fetch leads for each form
      for (const form of formList) {
        try {
          const leadsResp = await axios.get(`${this.baseUrl}/${this.version}/${form.id}/leads`, {
            params: { 
              access_token: accessToken,
              since: fourHoursAgo,
              limit: 100 
            }
          });

          const leads = leadsResp.data?.data || [];
          for (const rawLead of leads) {
            const result = await this.processLead(rawLead);
            if (result) totalSynced++;
          }
        } catch (err: any) {
          console.error(`[MetaService] Error syncing form ${form.id} (${form.name}):`, err.response?.data || err.message);
        }
      }

      console.log(`[MetaService] Sync completed. Total new leads ingested: ${totalSynced}`);
    } catch (error: any) {
      console.error('[MetaService] Error during lead sync:', error.response?.data || error.message);
    }
  }
}

export default new MetaService();
