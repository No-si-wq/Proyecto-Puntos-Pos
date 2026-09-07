/*
  Warnings:

  - You are about to drop the column `customerId` on the `Remission` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Remission" DROP CONSTRAINT "Remission_customerId_fkey";

-- AlterTable
ALTER TABLE "Remission" DROP COLUMN "customerId",
ADD COLUMN     "customerName" TEXT;
