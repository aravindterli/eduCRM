import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function deepReset() {
  const userToken = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID || '1023801707486504';
  const appId = '952327234394296';
  const appSecret = 'af4fb5ce9967947ee2b93cecdd e884f2'.replace(' ', ''); // Cleanup space
  const version = 'v19.0';
  
  console.log('--- META DEEP RESET ---');
  
  try {
    // 1. Get an App Access Token
    console.log('\n[1/4] Generating App Access Token...');
    const appTokenResp = await axios.get(`https://graph.facebook.com/oauth/access_token`, {
      params: { client_id: appId, client_secret: appSecret, grant_type: 'client_credentials' }
    });
    const appToken = appTokenResp.data.access_token;
    console.log('App Token generated successfully.');

    // 2. FORCE DELETE previous subscription (using App Token)
    console.log('\n[2/4] Wiping existing subscriptions...');
    try {
      await axios.delete(`https://graph.facebook.com/${version}/${pageId}/subscribed_apps`, {
        params: { access_token: appToken }
      });
      console.log('Cleaned up successfully.');
    } catch (e: any) {
      console.log('No existing subscription found, or cleanup skipped.');
    }

    // 3. FRESH SUBSCRIBE (using Page/User Token)
    console.log('\n[3/4] Creating fresh bridge for "leadgen" field...');
    const subResponse = await axios.post(`https://graph.facebook.com/${version}/${pageId}/subscribed_apps`, null, {
      params: { access_token: userToken, subscribed_fields: 'leadgen' }
    });
    console.log('Subscription response:', subResponse.data);

    // 4. FINAL VERIFICATION
    console.log('\n[4/4] Verifying connection status...');
    const listResponse = await axios.get(`https://graph.facebook.com/${version}/${pageId}/subscribed_apps`, {
      params: { access_token: userToken }
    });
    
    const isSubscribed = listResponse.data.data.some((app: any) => app.id === appId);
    if (isSubscribed) {
      console.log('\n✅ DEEP RESET COMPLETE: Foundrys CRM App is officially linked!');
      console.log('Go to the Testing Tool and click Track Status. If it fails, wait 2 minutes for Meta cache.');
    } else {
      console.log('\n❌ FAILED: App still not appearing in subscribed list.');
    }

  } catch (error: any) {
    console.error('\n❌ RESET FAILED');
    console.error(JSON.stringify(error.response?.data?.error || error.message, null, 2));
  }
}

deepReset();
