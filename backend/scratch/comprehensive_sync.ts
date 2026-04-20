import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import MetaService from '../services/meta.service';

const PAGE_ID = process.env.META_PAGE_ID || '1023801707486504';
const TOKEN = process.env.META_ACCESS_TOKEN;

async function syncAllLeads() {
  if (!TOKEN) {
    console.error('ERROR: META_ACCESS_TOKEN not set');
    return;
  }

  console.log(`--- 🔍 DISCOVERING ALL FORMS FOR PAGE: ${PAGE_ID} ---`);
  
  try {
    // 1. Fetch all lead forms
    const formsRes = await axios.get(`https://graph.facebook.com/v19.0/${PAGE_ID}/leadgen_forms`, {
      params: { access_token: TOKEN, fields: 'id,name,status,leads_count' }
    });

    const forms = formsRes.data.data;
    console.log(`Found ${forms.length} forms.\n`);
    
    let grandTotal = 0;

    for (const form of forms) {
      console.log(`Processing [${form.name}] (ID: ${form.id}, Leads: ${form.leads_count})...`);
      
      // 2. Fetch all leads for this form
      let nextUrl = `https://graph.facebook.com/v19.0/${form.id}/leads?fields=id,created_time,field_data&access_token=${TOKEN}`;
      let formTotal = 0;

      while (nextUrl) {
        const leadsRes: any = await axios.get(nextUrl);
        const leads = leadsRes.data.data;
        
        if (leads && leads.length > 0) {
          console.log(`  Fetched ${leads.length} leads...`);
          for (const lead of leads) {
            try {
              const result = await MetaService.processLead(lead);
              if (result) formTotal++;
            } catch (err: any) {
              console.error(`  Error processing lead ${lead.id}: ${err.message}`);
            }
          }
        }
        
        nextUrl = leadsRes.data.paging?.next || null;
      }

      console.log(`  Total leads synced for this form: ${formTotal}\n`);
      grandTotal += formTotal;
    }

    console.log(`\n--- ✅ COMPREHENSIVE SYNC COMPLETE ---`);
    console.log(`Grand Total Leads Processed/Saved: ${grandTotal}`);
    process.exit(0);

  } catch (error: any) {
    console.error('CRITICAL ERROR:', error.response?.data || error.message);
    process.exit(1);
  }
}

syncAllLeads();
