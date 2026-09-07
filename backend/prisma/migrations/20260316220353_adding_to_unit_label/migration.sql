/*
  Warnings:

  - Added the required column `toUnitLabel` to the `UnitConversion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UnitConversion" ADD COLUMN     "toUnitLabel" TEXT NOT NULL;
