-- CreateEnum
CREATE TYPE "PriceMode" AS ENUM ('TAX_INCLUDED', 'TAX_EXCLUDED');

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "priceMode" "PriceMode" NOT NULL DEFAULT 'TAX_INCLUDED';
