import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const PAGE_ID = process.env.META_PAGE_ID;
const TOKEN = process.env.META_ACCESS_TOKEN;

async function subscribe() {
  if (!PAGE_ID || !TOKEN) {
    console.error('ERROR: META_PAGE_ID or META_ACCESS_TOKEN not set in .env');
    return;
  }

  console.log(`--- 🚀 SUBSCRIBING APP TO PAGE: ${PAGE_ID} ---`);

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${PAGE_ID}/subscribed_apps`,
      null,
      {
        params: {
          access_token: TOKEN,
          subscribed_fields: 'leadgen'
        }
      }
    );

    console.log('✅ Subscription Successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\nNext Step: Go to Meta App Dashboard -> Webhooks and ensure leadgen is selected.');

  } catch (error: any) {
    console.error('❌ Subscription Failed:', error.response?.data || error.message);
  }
}

subscribe();
