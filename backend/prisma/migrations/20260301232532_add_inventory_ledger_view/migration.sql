-- ==========================================
-- INVENTORY LEDGER VIEW (KARDEX BASE)
-- ==========================================

CREATE OR REPLACE VIEW inventory_ledger AS

-- =====================
-- ENTRADAS (COMPRAS)
-- =====================
SELECT
  p."createdAt"                AS date,
  'IN'                         AS type,
  pi."productId"               AS "productId",
  pi."warehouseId"             AS "warehouseId",
  pi.quantity                  AS quantity,
  pi.cost                      AS unit_cost,
  (pi.quantity * pi.cost)      AS movement_value,
  CONCAT('PUR-', pi."purchaseId") AS reference
FROM "PurchaseItem" pi
INNER JOIN "Purchase" p
  ON p.id = pi."purchaseId"

UNION ALL

-- =====================
-- SALIDAS (VENTAS FIFO)
-- =====================
SELECT
  s."createdAt"                AS date,
  'OUT'                        AS type,
  pi."productId"               AS "productId",
  pi."warehouseId"             AS "warehouseId",
  sil.quantity                 AS quantity,
  pi.cost                      AS unit_cost,
  (sil.quantity * pi.cost)     AS movement_value,
  s."saleNumber"               AS reference
FROM "SaleItemLot" sil
INNER JOIN "PurchaseItem" pi
  ON pi.id = sil."purchaseItemId"
INNER JOIN "SaleItem" si
  ON si.id = sil."saleItemId"
INNER JOIN "Sale" s
  ON s.id = si."saleId"
WHERE s.status = 'COMPLETED';