import MetaService from '../services/meta.service';
import dotenv from 'dotenv';
dotenv.config();

async function runSubscription() {
  const pageId = process.env.META_PAGE_ID || '1023801707486504';
  console.log(`[Script] Attempting to subscribe app to Page ID: ${pageId}...`);
  try {
    const result = await MetaService.subscribePage(pageId);
    console.log('[Script] Success! Meta Response:', JSON.stringify(result, null, 2));
    console.log('[Script] Your CRM is now officially linked to your Facebook Page.');
  } catch (error: any) {
    console.error('[Script] Failed to subscribe:', error.response?.data || error.message);
  }
}

runSubscription();
