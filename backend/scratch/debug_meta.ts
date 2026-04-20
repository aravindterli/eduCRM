import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function debugMeta() {
  const token = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID || '1023801707486504';
  
  console.log('--- META DEBUG REPORT ---');
  console.log(`Token starts with: ${token?.substring(0, 15)}...`);
  console.log(`Page ID: ${pageId}`);

  try {
    // 1. Check Token Info
    console.log('\n[1/2] Checking Token Permissions...');
    const debugResponse = await axios.get('https://graph.facebook.com/debug_token', {
      params: {
        input_token: token,
        access_token: token // Using same token as admin token
      }
    });
    console.log('Permissions found:', debugResponse.data.data.scopes.join(', '));
    
    // 2. Try to fetch leads from the page
    console.log('\n[2/2] Attempting to fetch leads from Page...');
    const leadsResponse = await axios.get(`https://graph.facebook.com/v19.0/${pageId}/leads`, {
      params: { access_token: token, limit: 1 }
    });
    console.log('Success! Leads found:', leadsResponse.data.data.length);

  } catch (error: any) {
    console.error('\n❌ DEBUG FAILED');
    console.error('Error Status:', error.response?.status);
    console.error('Error Message:', JSON.stringify(error.response?.data?.error || error.message, null, 2));
    
    if (error.response?.data?.error?.code === 100) {
      console.log('\n💡 TIP: Code 100 usually means the Lead Access Manager is blocking you. Check Meta Business Suite.');
    }
  }
}

debugMeta();
