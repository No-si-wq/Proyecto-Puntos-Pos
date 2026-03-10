/*
  Warnings:

  - Added the required column `active` to the `CommissionLevel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CommissionLevel" ADD COLUMN     "active" BOOLEAN NOT NULL;
