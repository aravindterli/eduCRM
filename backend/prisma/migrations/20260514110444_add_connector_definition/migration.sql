-- CreateTable
CREATE TABLE "ConnectorDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "fields" JSONB NOT NULL,
    "instructions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectorDefinition_pkey" PRIMARY KEY ("id")
);
