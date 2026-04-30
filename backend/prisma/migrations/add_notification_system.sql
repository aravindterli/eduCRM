-- Migration: add_notification_system
-- Creates NotificationRule and ScheduledNotification tables

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
);

CREATE INDEX IF NOT EXISTS "NotificationRule_trigger_isActive_idx"
  ON "NotificationRule"("trigger", "isActive");

ALTER TABLE "NotificationRule"
  ADD CONSTRAINT "NotificationRule_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "MessageTemplate"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

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
);

CREATE INDEX IF NOT EXISTS "ScheduledNotification_status_scheduledAt_idx"
  ON "ScheduledNotification"("status", "scheduledAt");

CREATE INDEX IF NOT EXISTS "ScheduledNotification_leadId_idx"
  ON "ScheduledNotification"("leadId");

ALTER TABLE "ScheduledNotification"
  ADD CONSTRAINT "ScheduledNotification_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;
