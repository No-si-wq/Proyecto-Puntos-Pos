-- =====================================================
-- CONVERT inventory_ledger TO MATERIALIZED VIEW (V3)
-- =====================================================

DROP VIEW IF EXISTS inventory_ledger;
DROP MATERIALIZED VIEW IF EXISTS inventory_ledger;

CREATE MATERIALIZED VIEW inventory_ledger AS

SELECT
  unique_id,

  date,
  type,
  "productId",
  "warehouseId",
  quantity,
  unit_cost,
  movement_value,
  reference

FROM (

  -- =====================
  -- ENTRADAS (COMPRAS)
  -- =====================
  SELECT
    CONCAT('IN-', pi.id) AS unique_id,  -- 🔥 usa ID real
    p."createdAt"        AS date,
    'IN'                 AS type,
    pi."productId",
    pi."warehouseId",
    pi.quantity,
    pi.cost              AS unit_cost,
    (pi.quantity * pi.cost) AS movement_value,
    CONCAT('PUR-', pi."purchaseId") AS reference
  FROM "PurchaseItem" pi
  INNER JOIN "Purchase" p
    ON p.id = pi."purchaseId"

  UNION ALL

  -- =====================
  -- SALIDAS (VENTAS FIFO)
  -- =====================
  SELECT
    CONCAT('OUT-', sil."saleItemId", '-', sil."purchaseItemId") AS unique_id, -- 🔥 combinación única real
    s."createdAt"         AS date,
    'OUT'                 AS type,
    pi."productId",
    pi."warehouseId",
    sil.quantity,
    pi.cost               AS unit_cost,
    (sil.quantity * pi.cost) AS movement_value,
    s."saleNumber"        AS reference
  FROM "SaleItemLot" sil
  INNER JOIN "PurchaseItem" pi
    ON pi.id = sil."purchaseItemId"
  INNER JOIN "SaleItem" si
    ON si.id = sil."saleItemId"
  INNER JOIN "Sale" s
    ON s.id = si."saleId"
  WHERE s.status = 'COMPLETED'

) movements;

-- Índice único real
CREATE UNIQUE INDEX idx_inventory_ledger_unique
ON inventory_ledger (unique_id);

-- Índice de búsqueda
CREATE INDEX idx_inventory_ledger_lookup
ON inventory_ledger ("productId", "warehouseId", date);