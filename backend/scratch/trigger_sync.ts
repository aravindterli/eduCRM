import MetaService from '../services/meta.service';
import dotenv from 'dotenv';
dotenv.config();

async function runSyc() {
  console.log('--- MANUAL META SYNC START ---');
  try {
    await MetaService.syncRecentLeads();
    console.log('--- MANUAL META SYNC END ---');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

runSyc();
