const axios = require('axios');

async function findPageTokens() {
  const userToken = 'EAASvh7cN6vwBRGsrKiC794kDMd8smBahafidtnNSmH99zC4j9Vq605MTCJoXsaHUKGirktLxrW9ZChVu5dYruvIQlIjjGIrTTq5pNfzH4tTrDeHtB1gvyh8ZC3AEagmEy69hM9p4eCzoWB2N8uWCY7OLkd41mp0ZAL5aYudh4LuULUbTVGixxZCMqim5yOAnFnJtZALj5lbMpHiHbmU79iS4EjoqaCe36eC1FrxAz2OF8s4bVTgZDZD';
  
  try {
    console.log('Fetching accounts for the provided user token...');
    const res = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}`);
    
    const accounts = res.data.data;
    if (!accounts || accounts.length === 0) {
      console.log('No Pages found for this User Token. Please ensure the token was generated with "pages_show_list" permission.');
      return;
    }

    console.log('--- AVAILABLE PAGES ---');
    for (const page of accounts) {
      console.log(`Page: ${page.name}`);
      console.log(`  ID: ${page.id}`);
      console.log(`  Token: ${page.access_token}`);
      
      // Try to list forms for this page
      try {
        const formsRes = await axios.get(`https://graph.facebook.com/v19.0/${page.id}/leadgen_forms?access_token=${page.access_token}`);
        if (formsRes.data.data && formsRes.data.data.length > 0) {
          console.log('  Available Forms:');
          formsRes.data.data.forEach(f => console.log(`    - ${f.name} (ID: ${f.id})`));
        } else {
          console.log('  No lead forms found for this page.');
        }
      } catch (fErr) {
        console.log(`  Could not fetch forms: ${fErr.response?.data?.error?.message || fErr.message}`);
      }
      console.log('------------------------');
    }
  } catch (err) {
    console.error('Failed to fetch accounts:', err.response?.data || err.message);
  }
}

findPageTokens();
