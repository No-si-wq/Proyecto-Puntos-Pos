-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateTable
CREATE TABLE "Quotation" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "taxTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "customerId" INTEGER,
    "userId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "priceListId" INTEGER,
    "sellerId" INTEGER,
    "observations" TEXT,
    "expiresAt" TIMESTAMP(3),
    "convertedSaleId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" SERIAL NOT NULL,
    "quotationId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
    "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lineSubtotal" DECIMAL(12,2) NOT NULL,
    "tax" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_convertedSaleId_key" ON "Quotation"("convertedSaleId");

-- CreateIndex
CREATE INDEX "Quotation_tenantId_idx" ON "Quotation"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_tenantId_quotationNumber_key" ON "Quotation"("tenantId", "quotationNumber");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_convertedSaleId_fkey" FOREIGN KEY ("convertedSaleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
