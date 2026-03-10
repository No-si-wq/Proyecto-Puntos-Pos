-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('SALE', 'REVERSAL');

-- CreateTable
CREATE TABLE "Commission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "saleId" INTEGER NOT NULL,
    "saleItemId" INTEGER,
    "percent" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "CommissionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Commission_userId_idx" ON "Commission"("userId");

-- CreateIndex
CREATE INDEX "Commission_saleId_idx" ON "Commission"("saleId");

-- CreateIndex
CREATE INDEX "SalesCommission_userId_idx" ON "SalesCommission"("userId");

-- CreateIndex
CREATE INDEX "SalesCommission_levelId_idx" ON "SalesCommission"("levelId");

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
