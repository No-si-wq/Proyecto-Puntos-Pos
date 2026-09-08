-- CreateEnum
CREATE TYPE "BankTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT');

-- AlterTable
ALTER TABLE "PayablePayment" ADD COLUMN     "bankId" INTEGER;

-- AlterTable
ALTER TABLE "ReceivablePayment" ADD COLUMN     "bankId" INTEGER;

-- CreateTable
CREATE TABLE "Bank" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountType" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'HNL',
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "bankId" INTEGER NOT NULL,
    "type" "BankTransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "referenceType" TEXT,
    "referenceId" INTEGER,
    "transferGroupId" INTEGER,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bank_tenantId_idx" ON "Bank"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Bank_tenantId_name_key" ON "Bank"("tenantId", "name");

-- CreateIndex
CREATE INDEX "BankTransaction_tenantId_bankId_idx" ON "BankTransaction"("tenantId", "bankId");

-- CreateIndex
CREATE INDEX "BankTransaction_tenantId_transferGroupId_idx" ON "BankTransaction"("tenantId", "transferGroupId");

-- AddForeignKey
ALTER TABLE "Bank" ADD CONSTRAINT "Bank_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivablePayment" ADD CONSTRAINT "ReceivablePayment_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayablePayment" ADD CONSTRAINT "PayablePayment_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
