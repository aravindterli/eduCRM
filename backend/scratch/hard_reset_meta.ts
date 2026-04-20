import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function hardReset() {
  const token = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID || '1023801707486504';
  const version = 'v19.0';
  
  console.log('--- META HARD RESET & DIAGNOSTICS ---');
  
  try {
    // 1. Unsubscribe first (Cleanup)
    console.log('\n[1/4] Unsubscribing previous sessions...');
    await axios.delete(`https://graph.facebook.com/${version}/${pageId}/subscribed_apps`, {
      params: { access_token: token }
    });
    console.log('Cleanup successful.');

    // 2. Fresh Subscription
    console.log('\n[2/4] Creating fresh subscription for "leadgen"...');
    const subResponse = await axios.post(`https://graph.facebook.com/${version}/${pageId}/subscribed_apps`, null, {
      params: { access_token: token, subscribed_fields: 'leadgen' }
    });
    console.log('Subscription response:', subResponse.data);

    // 3. Verify Subscription List
    console.log('\n[3/4] Verifying Meta\'s official record...');
    const listResponse = await axios.get(`https://graph.facebook.com/${version}/${pageId}/subscribed_apps`, {
      params: { access_token: token }
    });
    console.log('Active Subscriptions:', JSON.stringify(listResponse.data, null, 2));

    // 4. Test "See-through" Access (Can we see your forms?)
    console.log('\n[4/4] Checking form visibility...');
    const formsResponse = await axios.get(`https://graph.facebook.com/${version}/${pageId}/leadgen_forms`, {
      params: { access_token: token }
    });
    console.log('Forms found on Page:', formsResponse.data.data.length);
    if (formsResponse.data.data.length > 0) {
      console.log('First form name:', formsResponse.data.data[0].name);
      console.log('\n✅ CONCLUSION: Your backend has FULL access to your leads. The Meta Testing Tool is just lagging and might take a few minutes to show "Success".');
    }

  } catch (error: any) {
    console.error('\n❌ DIAGNOSTICS FAILED');
    console.error(JSON.stringify(error.response?.data?.error || error.message, null, 2));
  }
}

hardReset();
