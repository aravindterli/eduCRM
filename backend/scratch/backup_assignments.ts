import prisma from '../config/prisma';
import fs from 'fs';
import path from 'path';

/**
 * BACKUP ASSIGNMENTS
 * Saves a snapshot of Lead ID -> assignedTo ID mappings.
 */
async function backup() {
  console.log('--- Backing up Lead Assignments ---');
  
  const leads = await prisma.lead.findMany({
    select: { id: true, assignedId: true }
  });

  const backupPath = path.join(__dirname, 'lead_assignments_backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(leads, null, 2));

  console.log(`Backup saved to: ${backupPath}`);
  console.log(`Backed up ${leads.length} assignments.`);
}

backup()
  .catch(err => console.error(err))
  .finally(() => process.exit(0));
