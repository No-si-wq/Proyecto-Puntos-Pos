-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "baseUnit" TEXT NOT NULL DEFAULT 'UNIT',
ADD COLUMN     "baseUnitLabel" TEXT NOT NULL DEFAULT 'Unidad';

-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'UNIT',
ADD COLUMN     "unitQuantity" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "UnitConversion" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "fromUnit" TEXT NOT NULL,
    "toUnit" TEXT NOT NULL,
    "factor" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "UnitConversion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UnitConversion_tenantId_productId_fromUnit_toUnit_key" ON "UnitConversion"("tenantId", "productId", "fromUnit", "toUnit");

-- AddForeignKey
ALTER TABLE "UnitConversion" ADD CONSTRAINT "UnitConversion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
