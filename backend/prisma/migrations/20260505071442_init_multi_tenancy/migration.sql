/*
  Warnings:

  - Added the required column `tenantId` to the `Admission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `CounselingLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Fee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `FollowUp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Lead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Webinar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `WebinarRegistration` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeadNoteType" AS ENUM ('GENERAL', 'REMARK', 'STUDENT_FEEDBACK', 'DISCUSSION_SUMMARY');

-- CreateEnum
CREATE TYPE "Sector" AS ENUM ('EDUCATION', 'REAL_ESTATE', 'HEALTHCARE', 'GENERIC');

-- AlterEnum
ALTER TYPE "RoleType" ADD VALUE 'SUPERADMIN';

-- DropForeignKey
ALTER TABLE "Admission" DROP CONSTRAINT "Admission_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_leadId_fkey";

-- DropForeignKey
ALTER TABLE "CounselingLog" DROP CONSTRAINT "CounselingLog_leadId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "Fee" DROP CONSTRAINT "Fee_admissionId_fkey";

-- DropForeignKey
ALTER TABLE "FollowUp" DROP CONSTRAINT "FollowUp_leadId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_feeId_fkey";

-- DropForeignKey
ALTER TABLE "WebinarRegistration" DROP CONSTRAINT "WebinarRegistration_leadId_fkey";

-- AlterTable
ALTER TABLE "Admission" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CounselingLog" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Document',
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Fee" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FollowUp" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "meetingUrl" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "additionalData" JSONB,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "baseFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accent" TEXT NOT NULL DEFAULT 'blue',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'ocean';

-- AlterTable
ALTER TABLE "Webinar" ADD COLUMN     "meetingId" TEXT,
ADD COLUMN     "meetingUrl" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WebinarRegistration" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sector" "Sector" NOT NULL DEFAULT 'EDUCATION',
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "taskId" TEXT,
    "leadId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FOLLOW_UP',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "counselorId" TEXT,
    "duration" INTEGER,
    "result" TEXT,

    CONSTRAINT "CommunicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "LeadNoteType" NOT NULL DEFAULT 'GENERAL',

    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "templateId" TEXT,
    "offsets" INTEGER[] DEFAULT ARRAY[0]::INTEGER[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledNotification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ruleId" TEXT,
    "trigger" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipientId" TEXT,
    "contactInfo" TEXT,
    "templateId" TEXT,
    "templateKey" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "payload" JSONB,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorLog" TEXT,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_name_key" ON "MessageTemplate"("name");

-- CreateIndex
CREATE INDEX "Lead_tenantId_idx" ON "Lead"("tenantId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webinar" ADD CONSTRAINT "Webinar_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebinarRegistration" ADD CONSTRAINT "WebinarRegistration_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebinarRegistration" ADD CONSTRAINT "WebinarRegistration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounselingLog" ADD CONSTRAINT "CounselingLog_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounselingLog" ADD CONSTRAINT "CounselingLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounselingLog" ADD CONSTRAINT "CounselingLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "Fee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRule" ADD CONSTRAINT "NotificationRule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MessageTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRule" ADD CONSTRAINT "NotificationRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledNotification" ADD CONSTRAINT "ScheduledNotification_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledNotification" ADD CONSTRAINT "ScheduledNotification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
