/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,key]` on the table `SystemConfig` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenantId` to the `SystemConfig` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "SystemConfig_key_key";

-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "tenantId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_tenantId_key_key" ON "SystemConfig"("tenantId", "key");

-- AddForeignKey
ALTER TABLE "SystemConfig" ADD CONSTRAINT "SystemConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
