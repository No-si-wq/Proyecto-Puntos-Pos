/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,email,dni]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Customer_tenantId_email_key";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "dni" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_tenantId_email_dni_key" ON "Customer"("tenantId", "email", "dni");
