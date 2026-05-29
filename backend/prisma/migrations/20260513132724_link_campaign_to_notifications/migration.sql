-- AlterTable
ALTER TABLE "ScheduledNotification" ADD COLUMN     "marketingCampaignId" TEXT;

-- AddForeignKey
ALTER TABLE "ScheduledNotification" ADD CONSTRAINT "ScheduledNotification_marketingCampaignId_fkey" FOREIGN KEY ("marketingCampaignId") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
