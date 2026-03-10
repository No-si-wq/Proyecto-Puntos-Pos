-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "commissionAmount" DECIMAL(10,2),
ADD COLUMN     "commissionPercent" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "CommissionLevel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CommissionLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCommission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "levelId" INTEGER NOT NULL,
    "percent" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "SalesCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommissionLevel_name_key" ON "CommissionLevel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SalesCommission_userId_levelId_key" ON "SalesCommission"("userId", "levelId");

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "CommissionLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
