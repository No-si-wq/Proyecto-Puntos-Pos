-- AlterTable
ALTER TABLE "FiscalConfig" ADD COLUMN     "userId" INTEGER;

-- CreateTable
CREATE TABLE "UserSaleSequence" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "current" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "UserSaleSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSaleSequence_userId_key" ON "UserSaleSequence"("userId");

-- CreateIndex
CREATE INDEX "UserSaleSequence_tenantId_idx" ON "UserSaleSequence"("tenantId");

-- AddForeignKey
ALTER TABLE "FiscalConfig" ADD CONSTRAINT "FiscalConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSaleSequence" ADD CONSTRAINT "UserSaleSequence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
