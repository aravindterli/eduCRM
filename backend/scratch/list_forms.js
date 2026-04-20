const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function listForms() {
  const tokenRaw = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;

  if (!tokenRaw) {
    console.error('ERROR: META_ACCESS_TOKEN not found in .env');
    return;
  }

  // Clean the token: remove spaces, newlines, and hidden characters
  const token = tokenRaw.replace(/[^a-zA-Z0-9]/g, '').trim();

  console.log(`--- TESTING META ACCESS ---`);
  console.log(`Raw Length: ${tokenRaw.length}`);
  console.log(`Cleaned Length: ${token.length}`);
  
  try {
    // 1. Verify Token and Page
    console.log('Fetching account info for "me"...');
    const meRes = await axios.get(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${token.trim()}`);
    console.log(`SUCCESS! Connected to: ${meRes.data.name} (ID: ${meRes.data.id})`);

    const targetPageId = pageId || meRes.data.id;
    console.log(`Fetching forms for Page ID: ${targetPageId}...`);

    // 2. List Forms
    const formsRes = await axios.get(`https://graph.facebook.com/v19.0/${targetPageId}/leadgen_forms?access_token=${token.trim()}`);
    
    if (formsRes.data.data && formsRes.data.data.length > 0) {
      console.log(`\n✅ FOUND ${formsRes.data.data.length} FORMS:`);
      formsRes.data.data.forEach(form => {
        console.log(`- ${form.name} (ID: ${form.id}) [Status: ${form.status}]`);
      });
    } else {
      console.log('\n⚠️ No lead forms found for this page.');
    }
  } catch (err) {
    console.error('\n❌ FAILED:');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(`Error: ${JSON.stringify(err.response.data.error, null, 2)}`);
    } else {
      console.error(`Message: ${err.message}`);
    }
  }
}

listForms();
