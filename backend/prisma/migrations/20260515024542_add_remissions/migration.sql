-- CreateEnum
CREATE TYPE "RemissionStatus" AS ENUM ('PENDING', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Remission" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "remissionNumber" TEXT NOT NULL,
    "status" "RemissionStatus" NOT NULL DEFAULT 'PENDING',
    "warehouseId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Remission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemissionItem" (
    "id" SERIAL NOT NULL,
    "remissionId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "RemissionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Remission_tenantId_idx" ON "Remission"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Remission_tenantId_remissionNumber_key" ON "Remission"("tenantId", "remissionNumber");

-- AddForeignKey
ALTER TABLE "Remission" ADD CONSTRAINT "Remission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remission" ADD CONSTRAINT "Remission_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remission" ADD CONSTRAINT "Remission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remission" ADD CONSTRAINT "Remission_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemissionItem" ADD CONSTRAINT "RemissionItem_remissionId_fkey" FOREIGN KEY ("remissionId") REFERENCES "Remission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemissionItem" ADD CONSTRAINT "RemissionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
