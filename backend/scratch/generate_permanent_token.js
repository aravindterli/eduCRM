const axios = require('axios');

async function generatePermanentToken() {
  const appId = '1318897333431036';
  const appSecret = '14be884b1e4964cd0eba67f1f919ca13';
  const shortLivedUserToken = 'EAASvh7cN6vwBRGsrKiC794kDMd8smBahafidtnNSmH99zC4j9Vq605MTCJoXsaHUKGirktLxrW9ZChVu5dYruvIQlIjjGIrTTq5pNfzH4tTrDeHtB1gvyh8ZC3AEagmEy69hM9p4eCzoWB2N8uWCY7OLkd41mp0ZAL5aYudh4LuULUbTVGixxZCMqim5yOAnFnJtZALj5lbMpHiHbmU79iS4EjoqaCe36eC1FrxAz2OF8s4bVTgZDZD';
  const pageId = '1023801707486504';

  try {
    console.log('--- Step 1: Exchanging for Long-Lived User Token ---');
    const userRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortLivedUserToken
      }
    });
    
    const longLivedUserToken = userRes.data.access_token;
    console.log('Successfully generated Long-Lived User Token.');

    console.log('\n--- Step 2: Fetching Permanent Page Token ---');
    const pageRes = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
      params: {
        fields: 'access_token,name',
        access_token: longLivedUserToken
      }
    });

    const permanentPageToken = pageRes.data.access_token;
    const pageName = pageRes.data.name;

    console.log(`\nSUCCESS! Generated Permanent Token for Page: ${pageName}`);
    console.log(`Token: ${permanentPageToken}`);
    console.log('\nThis token is PERMANENT and will NOT expire.');

  } catch (err) {
    console.error('Failed to generate permanent token:', err.response?.data || err.message);
  }
}

generatePermanentToken();
