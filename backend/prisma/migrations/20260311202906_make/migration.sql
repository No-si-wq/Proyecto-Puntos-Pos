/*
  Warnings:

  - A unique constraint covering the columns `[registrationKey]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.
  - Made the column `slug` on table `Tenant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "inviteOnly" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxUsers" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "maxWarehouses" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "registrationKey" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "active" SET DEFAULT false,
ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_registrationKey_key" ON "Tenant"("registrationKey");
