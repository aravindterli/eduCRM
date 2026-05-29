import prisma from '../config/prisma';

async function migrateStages() {
  console.log('Starting Lead Stage Database Migration...');

  const mappings = [
    { from: 'NEW_LEAD', to: 'NEW' },
    { from: 'CONTACT_ATTEMPTED', to: 'CONTACTED' },
    { from: 'CONTACT_MADE', to: 'CONTACTED' },
    { from: 'INTERESTED', to: 'QUALIFIED' },
    { from: 'COUNSELING_SCHEDULED', to: 'MEETING SCHEDULED' },
    { from: 'WEBINAR_REGISTERED', to: 'RESPONDED' },
    { from: 'WEBINAR_ATTENDED', to: 'RESPONDED' },
    { from: 'APPLICATION_STARTED', to: 'NEGOTIATION' },
    { from: 'APPLICATION_SUBMITTED', to: 'NEGOTIATION' },
    { from: 'ADMISSION_CONFIRMED', to: 'CONVERTED' },
    { from: 'ADMISSION', to: 'CONVERTED' },
    { from: 'LOST_LEAD', to: 'LOST' },
    { from: 'RE_ENGAGEMENT', to: 'RE-ENGAGEMENT' },
  ];

  for (const mapping of mappings) {
    try {
      const result = await prisma.lead.updateMany({
        where: { stage: mapping.from },
        data: { stage: mapping.to },
      });
      console.log(`Successfully migrated stage from "${mapping.from}" to "${mapping.to}": ${result.count} records updated.`);
    } catch (error: any) {
      console.error(`Failed to migrate stage from "${mapping.from}" to "${mapping.to}":`, error.message);
    }
  }

  console.log('Lead Stage Database Migration Completed.');
}

migrateStages()
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
