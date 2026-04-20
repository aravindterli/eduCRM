import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function checkForms() {
  const token = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID || '1023801707486504';
  const version = 'v19.0';
  
  console.log('--- META CONNECTIVITY CHECK ---');
  
  try {
    // 1. Try to fetch forms
    console.log(`\n[1/2] Checking if we can see forms for Page ${pageId}...`);
    const formsResponse = await axios.get(`https://graph.facebook.com/${version}/${pageId}/leadgen_forms`, {
      params: { access_token: token }
    });
    
    console.log('Results:', JSON.stringify(formsResponse.data, null, 2));
    
    // 2. Try to fetch current leads (to check permissions)
    console.log('\n[2/2] Checking if we can read existing leads...');
    const leadsResponse = await axios.get(`https://graph.facebook.com/${version}/${pageId}/leads`, {
      params: { access_token: token, limit: 1 }
    });
    console.log('Leads access verified! Found:', leadsResponse.data.data.length);
    console.log('\n✅ VERDICT: Your token and permissions are 100% correct.');

  } catch (error: any) {
    console.error('\n❌ CONNECTIVITY FAILED');
    console.error('Meta Error:', JSON.stringify(error.response?.data?.error || error.message, null, 2));
  }
}

checkForms();
