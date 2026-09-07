/*
  Warnings:

  - You are about to alter the column `factor` on the `UnitConversion` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - Added the required column `fromUnitLabel` to the `UnitConversion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UnitConversion" ADD COLUMN     "fromUnitLabel" TEXT NOT NULL,
ALTER COLUMN "factor" SET DATA TYPE INTEGER;
