/*
  Warnings:

  - Made the column `warehouseId` on table `SaleSequence` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "SaleSequence" DROP CONSTRAINT "SaleSequence_warehouseId_fkey";

-- AlterTable
ALTER TABLE "SaleSequence" ALTER COLUMN "warehouseId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "SaleSequence" ADD CONSTRAINT "SaleSequence_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
