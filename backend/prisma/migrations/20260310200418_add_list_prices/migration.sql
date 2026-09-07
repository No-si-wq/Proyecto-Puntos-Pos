-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('SALE', 'REVERSAL');

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "priceListId" INTEGER;

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "commissionAmount" DECIMAL(10,2),
ADD COLUMN     "commissionPercent" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "PriceList" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPrice" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "priceListId" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionLevel" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CommissionLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCommission" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "levelId" INTEGER NOT NULL,
    "percent" DECIMAL(5,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SalesCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
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
CREATE INDEX "PriceList_tenantId_idx" ON "PriceList"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceList_tenantId_name_key" ON "PriceList"("tenantId", "name");

-- CreateIndex
CREATE INDEX "ProductPrice_tenantId_idx" ON "ProductPrice"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPrice_tenantId_productId_priceListId_key" ON "ProductPrice"("tenantId", "productId", "priceListId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionLevel_tenantId_name_key" ON "CommissionLevel"("tenantId", "name");

-- CreateIndex
CREATE INDEX "SalesCommission_tenantId_idx" ON "SalesCommission"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesCommission_tenantId_userId_levelId_key" ON "SalesCommission"("tenantId", "userId", "levelId");

-- CreateIndex
CREATE INDEX "Commission_tenantId_idx" ON "Commission"("tenantId");

-- CreateIndex
CREATE INDEX "Commission_tenantId_userId_idx" ON "Commission"("tenantId", "userId");

-- AddForeignKey
ALTER TABLE "PriceList" ADD CONSTRAINT "PriceList_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionLevel" ADD CONSTRAINT "CommissionLevel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "CommissionLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE SET NULL ON UPDATE CASCADE;
