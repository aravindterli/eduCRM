require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Applying notification system migration...');

  try {
    // Create NotificationRule table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NotificationRule" (
        "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "name"        TEXT NOT NULL,
        "description" TEXT,
        "trigger"     TEXT NOT NULL,
        "channel"     TEXT NOT NULL,
        "templateId"  TEXT,
        "offsets"     INTEGER[] NOT NULL DEFAULT ARRAY[0],
        "isActive"    BOOLEAN NOT NULL DEFAULT true,
        "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "NotificationRule_pkey" PRIMARY KEY ("id")
      )
    `);
    console.log('✅ NotificationRule table created');

    // Index
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "NotificationRule_trigger_isActive_idx"
        ON "NotificationRule"("trigger", "isActive")
    `);

    // Foreign key to MessageTemplate (safe — ignore if already exists)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "NotificationRule"
          ADD CONSTRAINT "NotificationRule_templateId_fkey"
          FOREIGN KEY ("templateId") REFERENCES "MessageTemplate"("id")
          ON DELETE SET NULL ON UPDATE CASCADE
      `);
    } catch(_) {}

    // Create ScheduledNotification table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ScheduledNotification" (
        "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "ruleId"       TEXT,
        "trigger"      TEXT NOT NULL,
        "channel"      TEXT NOT NULL,
        "recipientId"  TEXT,
        "contactInfo"  TEXT,
        "templateId"   TEXT,
        "templateKey"  TEXT,
        "subject"      TEXT,
        "body"         TEXT,
        "payload"      JSONB,
        "scheduledAt"  TIMESTAMP(3) NOT NULL,
        "sentAt"       TIMESTAMP(3),
        "status"       TEXT NOT NULL DEFAULT 'PENDING',
        "retryCount"   INTEGER NOT NULL DEFAULT 0,
        "errorLog"     TEXT,
        "leadId"       TEXT,
        "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ScheduledNotification_pkey" PRIMARY KEY ("id")
      )
    `);
    console.log('✅ ScheduledNotification table created');

    // Indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ScheduledNotification_status_scheduledAt_idx"
        ON "ScheduledNotification"("status", "scheduledAt")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ScheduledNotification_leadId_idx"
        ON "ScheduledNotification"("leadId")
    `);

    // FK to Lead
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "ScheduledNotification"
          ADD CONSTRAINT "ScheduledNotification_leadId_fkey"
          FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
          ON DELETE SET NULL ON UPDATE CASCADE
      `);
    } catch(_) {}

    console.log('\n--- Verification ---');
    const r1 = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "NotificationRule"`);
    console.log('✅ NotificationRule rows:', r1[0].count);

    const r2 = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "ScheduledNotification"`);
    console.log('✅ ScheduledNotification rows:', r2[0].count);

    console.log('\n✅ Migration complete!');
  } catch(err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
