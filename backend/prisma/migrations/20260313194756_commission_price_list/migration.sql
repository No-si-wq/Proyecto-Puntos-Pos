-- AlterTable
ALTER TABLE "CommissionLevel" ADD COLUMN     "priceListId" INTEGER;

-- AddForeignKey
ALTER TABLE "CommissionLevel" ADD CONSTRAINT "CommissionLevel_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE SET NULL ON UPDATE CASCADE;
