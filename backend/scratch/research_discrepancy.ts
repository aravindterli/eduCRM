import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function research() {
  const token = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;

  if (!token || !pageId) {
    console.error('Missing token or pageId');
    return;
  }

  try {
    const res = await axios.get(`https://graph.facebook.com/v19.0/${pageId}/leadgen_forms`, {
      params: { 
        access_token: token,
        fields: 'id,name,leads_count,status'
      }
    });

    console.log('--- FB LEAD FORMS REPORT ---');
    console.log(JSON.stringify(res.data.data, null, 2));
    
    const totalOnFB = res.data.data.reduce((acc: number, f: any) => acc + (f.leads_count || 0), 0);
    console.log(`\nTotal Leads across all forms on FB: ${totalOnFB}`);

  } catch (error: any) {
    console.error('Error fetching forms:', error.response?.data || error.message);
  }
}

research();
