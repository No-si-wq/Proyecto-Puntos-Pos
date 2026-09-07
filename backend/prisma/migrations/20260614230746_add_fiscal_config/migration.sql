-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "fiscalConfigId" INTEGER;

-- AlterTable
ALTER TABLE "SaleSequence" ALTER COLUMN "current" SET DATA TYPE BIGINT;

-- CreateTable
CREATE TABLE "FiscalConfig" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "cai" TEXT NOT NULL,
    "establishment" TEXT NOT NULL DEFAULT '001',
    "emissionPoint" TEXT NOT NULL DEFAULT '001',
    "documentType" TEXT NOT NULL DEFAULT '01',
    "rangeStart" TEXT NOT NULL,
    "rangeEnd" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FiscalConfig_tenantId_idx" ON "FiscalConfig"("tenantId");

-- AddForeignKey
ALTER TABLE "FiscalConfig" ADD CONSTRAINT "FiscalConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_fiscalConfigId_fkey" FOREIGN KEY ("fiscalConfigId") REFERENCES "FiscalConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
