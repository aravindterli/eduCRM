const axios = require('axios');

async function triggerSync() {
  try {
    const res = await axios.post('http://localhost:5000/api/v1/leads/webhook/meta/sync', {
      formId: '1514105136891384'
    });
    console.log('Sync Response:', res.data);
  } catch (err) {
    console.error('Sync Failed:', err.response?.data || err.message);
  }
}

triggerSync();
