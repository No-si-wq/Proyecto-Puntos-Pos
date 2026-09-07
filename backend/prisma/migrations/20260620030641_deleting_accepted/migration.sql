/*
  Warnings:

  - The values [ACCEPTED] on the enum `QuotationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QuotationStatus_new" AS ENUM ('PENDING', 'REJECTED', 'EXPIRED', 'CONVERTED');
ALTER TABLE "public"."Quotation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Quotation" ALTER COLUMN "status" TYPE "QuotationStatus_new" USING ("status"::text::"QuotationStatus_new");
ALTER TYPE "QuotationStatus" RENAME TO "QuotationStatus_old";
ALTER TYPE "QuotationStatus_new" RENAME TO "QuotationStatus";
DROP TYPE "public"."QuotationStatus_old";
ALTER TABLE "Quotation" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
