import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function checkSubscription() {
  const token = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID || '1023801707486504';
  const version = 'v19.0';
  
  console.log('--- SUBSCRIPTION CHECK ---');
  try {
    const response = await axios.get(`https://graph.facebook.com/${version}/${pageId}/subscribed_apps`, {
      params: { access_token: token }
    });
    
    console.log('Subscribed Apps on this Page:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const isSubscribed = response.data.data.some((app: any) => app.id === '952327234394296');
    if (isSubscribed) {
      console.log('\n✅ VERIFIED: Foundrys CRM App IS officially subscribed to this page!');
      console.log('If the testing tool is failing, it is just a delay in their UI.');
    } else {
      console.log('\n❌ NOT FOUND: Foundrys CRM App is NOT in the subscribed list.');
    }
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkSubscription();
