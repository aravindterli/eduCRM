const axios = require('axios');

async function verifyToken() {
  const token = 'EAANiIivaEGLgBROfS96H4ZBy1ylWaEUal5MPQZB45hZBQtmKSgieiickDDFTasZBOfZAUEFmxbj8Mv7cbtd6xRILt1Dpaa66JDTw35eUfRFD4ZAFUFHeV5M3Ls5lZBZC9ZBwNNfaZAtnHEZBWsq7NvvtJRLm8lSWZBE6F67apvSWqpXkZCCYX55h2EDjoAyhe7rPavynzhZCI7mY4dBCyvHiZAPY5QO1lgdkZCwRXoVGXTj7G5EPBJIZA3AuwOExCzCColdFzqxxWTSC5ncjaaMhshonI4Llid3hgvfCidADPY4lPpGAZDZD'.trim();
  
  console.log(`Token Length: ${token.length}`);
  
  console.log('--- STARTING VERIFICATION ---');
  
  // 1. Try to get accounts (if it's a user token)
  try {
    console.log('Testing as USER TOKEN (fetching accounts)...');
    const res = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
    const accounts = res.data.data;
    
    if (accounts && accounts.length > 0) {
      console.log(`SUCCESS! Found ${accounts.length} pages.`);
      for (const page of accounts) {
        console.log(`- Page: ${page.name} (ID: ${page.id})`);
        
        // Try to fetch forms for each page
        try {
          const formsRes = await axios.get(`https://graph.facebook.com/v19.0/${page.id}/leadgen_forms?access_token=${page.access_token}`);
          if (formsRes.data.data && formsRes.data.data.length > 0) {
             console.log(`  Available Forms for ${page.name}:`);
             formsRes.data.data.forEach(f => console.log(`    - ${f.name} (ID: ${f.id})`));
          } else {
             console.log(`  No lead forms found for ${page.name}.`);
          }
        } catch (fErr) {
          console.log(`  Could not fetch forms for ${page.name}: ${fErr.response?.data?.error?.message || fErr.message}`);
        }
      }
      return;
    }
  } catch (err) {
    console.log(`Not a standard User Token or no accounts found: ${err.response?.data?.error?.message || err.message}`);
  }

  // 2. Try as a Page Token directly (fetching self)
  try {
    console.log('\nTesting as PAGE TOKEN (fetching self info)...');
    const res = await axios.get(`https://graph.facebook.com/v19.0/me?fields=id,name,category&access_token=${token}`);
    console.log(`SUCCESS! This is a token for: ${res.data.name} (ID: ${res.data.id})`);
    
    // Fetch forms for this page
    try {
      const formsRes = await axios.get(`https://graph.facebook.com/v19.0/${res.data.id}/leadgen_forms?access_token=${token}`);
      if (formsRes.data.data && formsRes.data.data.length > 0) {
         console.log(`Available Forms:`);
         formsRes.data.data.forEach(f => console.log(`- ${f.name} (ID: ${f.id})`));
      } else {
         console.log(`No lead forms found for this page.`);
      }
    } catch (fErr) {
      console.log(`Could not fetch forms: ${fErr.response?.data?.error?.message || fErr.message}`);
    }
  } catch (err) {
    console.log(`Failed as Page Token: ${err.response?.data?.error?.message || err.message}`);
  }
}

verifyToken();
