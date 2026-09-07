-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "status" "PurchaseStatus" NOT NULL DEFAULT 'ACTIVE';
