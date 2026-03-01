-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('NONE', 'PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "grossSubtotal" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "discountAmount" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN     "discountType" "DiscountType" DEFAULT 'NONE',
ADD COLUMN     "discountValue" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN     "lineSubtotal" DECIMAL(12,2);
