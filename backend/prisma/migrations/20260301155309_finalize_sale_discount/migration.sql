/*
  Warnings:

  - Made the column `grossSubtotal` on table `Sale` required. This step will fail if there are existing NULL values in that column.
  - Made the column `discountAmount` on table `SaleItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `discountType` on table `SaleItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `discountValue` on table `SaleItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lineSubtotal` on table `SaleItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "grossSubtotal" SET NOT NULL;

-- AlterTable
ALTER TABLE "SaleItem" ALTER COLUMN "discountAmount" SET NOT NULL,
ALTER COLUMN "discountType" SET NOT NULL,
ALTER COLUMN "discountValue" SET NOT NULL,
ALTER COLUMN "lineSubtotal" SET NOT NULL;
