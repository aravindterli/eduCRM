import BackupService from '../services/backup.service';
import dotenv from 'dotenv';

dotenv.config();

async function runManualBackup() {
  console.log('--- MANUAL BACKUP TRIGGERED ---');
  const success = await BackupService.performBackup();
  if (success) {
    console.log('Manual backup finished successfully.');
  } else {
    console.error('Manual backup failed.');
  }
}

runManualBackup();
