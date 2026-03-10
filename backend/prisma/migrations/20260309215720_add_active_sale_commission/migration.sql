/*
  Warnings:

  - Added the required column `active` to the `SalesCommission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SalesCommission" ADD COLUMN     "active" BOOLEAN NOT NULL;
