/*
  Warnings:

  - You are about to drop the column `baseUnit` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `baseUnitLabel` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `PurchaseItem` table. All the data in the column will be lost.
  - You are about to drop the column `unitQuantity` on the `PurchaseItem` table. All the data in the column will be lost.
  - You are about to drop the `UnitConversion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UnitConversion" DROP CONSTRAINT "UnitConversion_productId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "baseUnit",
DROP COLUMN "baseUnitLabel";

-- AlterTable
ALTER TABLE "PurchaseItem" DROP COLUMN "unit",
DROP COLUMN "unitQuantity";

-- DropTable
DROP TABLE "UnitConversion";
