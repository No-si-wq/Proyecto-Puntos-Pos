/*
  Warnings:

  - You are about to drop the column `Laboratiry` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "Laboratiry",
ADD COLUMN     "laboratory" TEXT;
