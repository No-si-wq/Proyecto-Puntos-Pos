/*
  Warnings:

  - A unique constraint covering the columns `[warehouseId]` on the table `SaleSequence` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
CREATE SEQUENCE salesequence_id_seq;
ALTER TABLE "SaleSequence" ADD COLUMN     "warehouseId" INTEGER,
ALTER COLUMN "id" SET DEFAULT nextval('salesequence_id_seq');
ALTER SEQUENCE salesequence_id_seq OWNED BY "SaleSequence"."id";

-- CreateIndex
CREATE UNIQUE INDEX "SaleSequence_warehouseId_key" ON "SaleSequence"("warehouseId");

-- AddForeignKey
ALTER TABLE "SaleSequence" ADD CONSTRAINT "SaleSequence_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
