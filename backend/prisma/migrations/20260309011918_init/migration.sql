-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'CREDIT');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('NONE', 'PERCENTAGE', 'FIXED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tokenVersionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevokedToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevokedToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Barcode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "Barcode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "warehouseId" INTEGER,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLedger" (
    "id" BIGSERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "movementValue" DECIMAL(20,6) NOT NULL,
    "referenceType" TEXT,
    "referenceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER,
    "note" TEXT,

    CONSTRAINT "InventoryLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "userId" INTEGER,
    "supplierId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "purchaseId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "warehouseId" INTEGER NOT NULL,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleSequence" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "warehouseId" INTEGER NOT NULL,

    CONSTRAINT "SaleSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "saleNumber" TEXT NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "grossSubtotal" DECIMAL(12,2) NOT NULL,
    "cogs" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pointsUsed" INTEGER NOT NULL DEFAULT 0,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "customerId" INTEGER,
    "userId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" SERIAL NOT NULL,
    "saleId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
    "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lineSubtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItemLot" (
    "saleItemId" INTEGER NOT NULL,
    "purchaseItemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "SaleItemLot_pkey" PRIMARY KEY ("saleItemId","purchaseItemId")
);

-- CreateTable
CREATE TABLE "LoyaltyPoint" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LoyaltyPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyPointHistory" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "saleId" INTEGER,
    "change" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyPointHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountReceivable" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
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
    "tenantId" INTEGER NOT NULL,
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

-- CreateTable
CREATE TABLE "_LoyaltyPointToLoyaltyPointHistory" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LoyaltyPointToLoyaltyPointHistory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_username_key" ON "User"("tenantId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "RevokedToken_token_key" ON "RevokedToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_tenantId_email_key" ON "Customer"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Supplier_tenantId_idx" ON "Supplier"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_tenantId_name_key" ON "Supplier"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Category_tenantId_idx" ON "Category"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_tenantId_name_parentId_key" ON "Category"("tenantId", "name", "parentId");

-- CreateIndex
CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_tenantId_sku_key" ON "Product"("tenantId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Barcode_code_key" ON "Barcode"("code");

-- CreateIndex
CREATE INDEX "Warehouse_tenantId_idx" ON "Warehouse"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_tenantId_name_key" ON "Warehouse"("tenantId", "name");

-- CreateIndex
CREATE INDEX "InventoryMovement_tenantId_idx" ON "InventoryMovement"("tenantId");

-- CreateIndex
CREATE INDEX "InventoryLedger_tenantId_productId_warehouseId_createdAt_id_idx" ON "InventoryLedger"("tenantId", "productId", "warehouseId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Purchase_tenantId_idx" ON "Purchase"("tenantId");

-- CreateIndex
CREATE INDEX "PurchaseItem_tenantId_idx" ON "PurchaseItem"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleSequence_warehouseId_key" ON "SaleSequence"("warehouseId");

-- CreateIndex
CREATE INDEX "SaleSequence_tenantId_idx" ON "SaleSequence"("tenantId");

-- CreateIndex
CREATE INDEX "Sale_tenantId_idx" ON "Sale"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_tenantId_saleNumber_key" ON "Sale"("tenantId", "saleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyPoint_customerId_key" ON "LoyaltyPoint"("customerId");

-- CreateIndex
CREATE INDEX "LoyaltyPoint_tenantId_idx" ON "LoyaltyPoint"("tenantId");

-- CreateIndex
CREATE INDEX "LoyaltyPointHistory_tenantId_idx" ON "LoyaltyPointHistory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountReceivable_saleId_key" ON "AccountReceivable"("saleId");

-- CreateIndex
CREATE INDEX "AccountReceivable_tenantId_idx" ON "AccountReceivable"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountPayable_purchaseId_key" ON "AccountPayable"("purchaseId");

-- CreateIndex
CREATE INDEX "AccountPayable_tenantId_idx" ON "AccountPayable"("tenantId");

-- CreateIndex
CREATE INDEX "_LoyaltyPointToLoyaltyPointHistory_B_index" ON "_LoyaltyPointToLoyaltyPointHistory"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Barcode" ADD CONSTRAINT "Barcode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleSequence" ADD CONSTRAINT "SaleSequence_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItemLot" ADD CONSTRAINT "SaleItemLot_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItemLot" ADD CONSTRAINT "SaleItemLot_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyPoint" ADD CONSTRAINT "LoyaltyPoint_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyPointHistory" ADD CONSTRAINT "LoyaltyPointHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyPointHistory" ADD CONSTRAINT "LoyaltyPointHistory_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountReceivable" ADD CONSTRAINT "AccountReceivable_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountReceivable" ADD CONSTRAINT "AccountReceivable_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivablePayment" ADD CONSTRAINT "ReceivablePayment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AccountReceivable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountPayable" ADD CONSTRAINT "AccountPayable_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountPayable" ADD CONSTRAINT "AccountPayable_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayablePayment" ADD CONSTRAINT "PayablePayment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AccountPayable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LoyaltyPointToLoyaltyPointHistory" ADD CONSTRAINT "_LoyaltyPointToLoyaltyPointHistory_A_fkey" FOREIGN KEY ("A") REFERENCES "LoyaltyPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LoyaltyPointToLoyaltyPointHistory" ADD CONSTRAINT "_LoyaltyPointToLoyaltyPointHistory_B_fkey" FOREIGN KEY ("B") REFERENCES "LoyaltyPointHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
