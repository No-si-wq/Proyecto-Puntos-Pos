-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateTable
CREATE TABLE "AccountReceivable" (
    "id" SERIAL NOT NULL,
    "saleId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountReceivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivablePayment" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "ReceivablePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountPayable" (
    "id" SERIAL NOT NULL,
    "purchaseId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountPayable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayablePayment" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "PayablePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountReceivable_saleId_key" ON "AccountReceivable"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountPayable_purchaseId_key" ON "AccountPayable"("purchaseId");

-- AddForeignKey
ALTER TABLE "AccountReceivable" ADD CONSTRAINT "AccountReceivable_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountReceivable" ADD CONSTRAINT "AccountReceivable_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivablePayment" ADD CONSTRAINT "ReceivablePayment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AccountReceivable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountPayable" ADD CONSTRAINT "AccountPayable_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountPayable" ADD CONSTRAINT "AccountPayable_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayablePayment" ADD CONSTRAINT "PayablePayment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AccountPayable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
