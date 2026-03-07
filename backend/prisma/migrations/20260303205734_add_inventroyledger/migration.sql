-- CreateTable
CREATE TABLE "InventoryLedger" (
    "id" BIGSERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" DECIMAL(20,6) NOT NULL,
    "movementValue" DECIMAL(20,6) NOT NULL,
    "referenceType" TEXT,
    "referenceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER,

    CONSTRAINT "InventoryLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryLedger_productId_warehouseId_createdAt_id_idx" ON "InventoryLedger"("productId", "warehouseId", "createdAt", "id");
