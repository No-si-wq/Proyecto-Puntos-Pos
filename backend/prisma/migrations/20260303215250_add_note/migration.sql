/*
  Warnings:

  - You are about to alter the column `quantity` on the `InventoryLedger` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,6)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "InventoryLedger" ADD COLUMN     "note" TEXT,
ALTER COLUMN "quantity" SET DATA TYPE INTEGER;
