const axios = require('axios');

async function aggressiveSearch() {
  const userToken = 'EAANiIivaEGLgBROfS96H4ZBy1ylWaEUal5MPQZB45hZBQtmKSgieiickDDFTasZBOfZAUEFmxbj8Mv7cbtd6xRILt1Dpaa66JDTw35eUfRFD4ZAFUFHeV5M3Ls5lZBZC9ZBwNNfaZAtnHEZBWsq7NvvtJRLm8lSWZBE6F67apvSWqpXkZCCYX55h2EDjoAyhe7rPavynzhZCI7mY4dBCyvHiZAPY5QO1lgdkZCwRXoVGXTj7G5EPBJIZA3AuwOExCzCColdFzqxxWTSC5ncjaaMhshonI4Llid3hgvfCidADPY4lPpGAZDZD';
  const pageIds = ['1023801707486504', '61573341593466'];

  for (const id of pageIds) {
    console.log(`\n--- Testing ID: ${id} ---`);
    try {
      // 1. Try to get Page details
      const details = await axios.get(`https://graph.facebook.com/v19.0/${id}?fields=name,access_token&access_token=${userToken}`);
      console.log(`Found Page: ${details.data.name}`);
      const token = details.data.access_token;

      if (token) {
        console.log(`Successfully retrieved Page Token: ${token}`);
        // 2. Try to list forms
        const formsRes = await axios.get(`https://graph.facebook.com/v19.0/${id}/leadgen_forms?access_token=${token}`);
        if (formsRes.data.data && formsRes.data.data.length > 0) {
          console.log('Available Forms:');
          formsRes.data.data.forEach(f => console.log(`  - ${f.name} (ID: ${f.id})`));
        } else {
          console.log('No lead forms found for this page.');
        }
      } else {
        console.log('No access_token returned for this ID using the User Token.');
      }
    } catch (err) {
      console.log(`Error for ID ${id}: ${err.response?.data?.error?.message || err.message}`);
    }
  }
}

aggressiveSearch();
