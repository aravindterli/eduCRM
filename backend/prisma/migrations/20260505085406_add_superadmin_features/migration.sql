-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "nextBillingDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionPlan" TEXT NOT NULL DEFAULT 'FREE',
ADD COLUMN     "subscriptionStatus" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" "Sector" NOT NULL,
    "fields" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FormTemplate" ADD CONSTRAINT "FormTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
