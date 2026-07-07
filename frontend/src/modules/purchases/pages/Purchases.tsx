import { useState, useRef, useEffect } from "react";
import {
  Card,
  Select,
  Input,
  Button,
  Divider,
  message,
  Row,
  Col,
  Tag,
  DatePicker,
  Select as AntSelect,
  Drawer,
} from "antd";
import { ShoppingCartOutlined, UploadOutlined } from "@ant-design/icons";

import * as XLSX from "xlsx";
import { usePurchases } from "../hooks/usePurchases";
import { useRequiredWarehouse } from "../../warehouses/hooks/useRequiredWarehouse";
import { purchaseCartStore } from "../types/purchaseCart.store";
import { useSuppliers } from "../../suppliers/useSuppliers";
import { formatCurrency } from "../../../core/utils/formatters";
import { PurchaseCartTable } from "../components/PurchaseCartTable";
import { useResponsiveSizes } from "../../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../../core/hooks/useDeviceType"; // ajusta el path
import { useWarehouseProducts } from "../../warehouses/hooks/useWarehouseProducts";
import type { PurchasePaymentMethod } from "../types/purchase";
import PageHeader from "../../../core/components/common/PageHeader";

export default function Purchases() {
  const [supplierId, setSupplierId]     = useState(undefined);
  const [paymentMethod, setPaymentMethod] = useState<PurchasePaymentMethod>("CASH");
  const [dueDate, setDueDate]           = useState<string>();
  const [summaryOpen, setSummaryOpen]   = useState(false);
  const [purchaseNumber, setPurchaseNumber] = useState<string>("");

  const warehouseId                     = useRequiredWarehouse();
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const { products, reload: reloadProducts }  = useWarehouseProducts();
  const { create, creating, unitConversions, loadUnitConversions } = usePurchases();
  const selectRef = useRef<any>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const cart      = purchaseCartStore();
  const sizes     = useResponsiveSizes();
  const { suppliers } = useSuppliers();
  const { isMobile, isTablet } = useDeviceType();
  const isCompact = isMobile || isTablet;

  useEffect(() => {
    cart.clear();
  }, [warehouseId]);

  const isSubmitDisabled =
    !supplierId ||
    cart.items.length === 0 ||
    !purchaseNumber ||
    (paymentMethod === "CREDIT" && !dueDate);

  async function submitPurchase() {
    if (!supplierId || cart.items.length === 0) {
      message.warning("Proveedor e items son requeridos");
      return;
    }
    if (paymentMethod === "CREDIT" && !dueDate) {
      message.error("Debe seleccionar fecha de vencimiento");
      return;
    }

    try {
      await create({
        supplierId,
        paymentMethod,
        dueDate,
        purchaseNumber,
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          cost: Number(i.cost),
          lotNumber: i.lotNumber ?? undefined,
          expiresAt: i.expiresAt ? i.expiresAt.toISOString() : undefined,
        })),
      });

      await reloadProducts();
      message.success("Compra registrada");
      cart.clear();
      setSupplierId(undefined);
      setPaymentMethod("CASH");
      setDueDate(undefined);
      setSummaryOpen(false);
      setPurchaseNumber("");
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ?? "Error registrando compra"
      );
    }
  }

  // ── Panel de resumen (reutilizado en sidebar y drawer) ────────────────────
  const summaryPanel = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <AntSelect
        value={paymentMethod}
        onChange={(value) => {
          setPaymentMethod(value);
          if (value !== "CREDIT") setDueDate(undefined);
        }}
        size={sizes.select}
        style={{ width: "100%" }}
        options={[
          { label: "Efectivo", value: "CASH" },
          { label: "Transferencia", value: "TRANSFER" },
          { label: "Crédito", value: "CREDIT" },
        ]}
      />

      {paymentMethod === "CREDIT" && (
        <>
          <Tag color="orange">Compra a crédito</Tag>
          <DatePicker
            style={{ width: "100%" }}
            size={sizes.select}
            placeholder="Fecha de vencimiento"
            onChange={(date) => setDueDate(date?.toISOString())}
          />
        </>
      )}

      <div
        style={{
          fontSize: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Total</span>
        <strong style={{ fontSize: sizes.totalFontSize }}>
          {formatCurrency(cart.total())}
        </strong>
      </div>

      <Divider style={{ margin: "4px 0" }} />

      <Button
        type="primary"
        size={sizes.button}
        block
        loading={creating}
        disabled={isSubmitDisabled}
        onClick={submitPurchase}
      >
        Registrar compra
      </Button>
    </div>
  );

  async function handleImportExcel(file: File) {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });

      if (rows.length === 0) {
        message.warning("El archivo no contiene filas");
        return;
      }

      const notFound: string[] = [];
      let importedCount = 0;

      for (const row of rows) {
        const sku = String(row.Codigo ?? row.codigo).trim();
        if (!sku) continue;

        const product = products.find((p) => p.sku === sku);
        if (!product) {
          notFound.push(sku);
          continue;
        }

        const quantity = Number(row.Cantidad ?? row.cantidad ?? 1);
        const cost = Number(row.Costo ?? row.costo ?? product.cost);
        const lotNumber = row.Lote || row.lote || undefined;
        const expiresRaw = row.Vencimiento ?? row.vencimiento;
        const expiresAt =
          expiresRaw instanceof Date
            ? expiresRaw
            : expiresRaw
            ? new Date(expiresRaw)
            : null;

        cart.addImportedItem(product, quantity, cost, lotNumber, expiresAt);
        importedCount++;

        if (!unitConversions[product.id]) void loadUnitConversions(product.id);
      }

      if (notFound.length > 0) {
        message.warning(
          `${importedCount} productos importados. No encontrados: ${notFound.join(", ")}`
        );
      } else {
        message.success(`${importedCount} productos importados desde Excel`);
      }
    } catch {
      message.error("No se pudo leer el archivo Excel");
    }
  }

  return (
    <>
      <PageHeader
        title="Compras"
        subtitle="Registro de compras a proveedores"
      />

      <Card
        title="Nueva compra"
        bodyStyle={{ padding: sizes.cardPadding }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: sizes.gap }}>

          <Card type="inner" title="Proveedor" style={{ marginBottom: 0 }}>
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportExcel(file);
                e.target.value = "";
              }}
            />

            <Button
              icon={<UploadOutlined />}
              onClick={() => importInputRef.current?.click()}
              disabled={!warehouseId}
              style={{ marginBottom: 16 }}
            >
              Importar Excel
            </Button>

            <Select
              showSearch
              virtual
              listHeight={sizes.selectListHeight}
              placeholder="Buscar proveedor..."
              allowClear
              value={supplierId}
              style={{ width: "100%" }}
              size={sizes.select}
              dropdownMatchSelectWidth
              onChange={setSupplierId}
              status={supplierId ?? undefined}
              optionFilterProp="label"
              filterOption={(input, option) => {
                const label = option?.label as string;
                return label?.toLowerCase().includes(input.toLowerCase());
              }}
              options={suppliers
                .filter((s) => s.active)
                .map((s) => ({ value: s.id, label: s.name }))}
            />
            <Input
              placeholder="Número de compra (ej: FAC-001)"
              size={sizes.select}
              value={purchaseNumber}
              onChange={(e) => setPurchaseNumber(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </Card>

          <Card type="inner" title="Productos" style={{ marginBottom: 0 }}>
            <Select
              ref={selectRef}
              showSearch
              allowClear
              autoClearSearchValue
              disabled={!warehouseId}
              placeholder="Buscar producto..."
              size={sizes.select}
              listHeight={sizes.selectListHeight}
              style={{ width: "100%", marginBottom: 16 }}
              optionFilterProp="label"
              defaultActiveFirstOption
              value={selectedProduct}
              onChange={setSelectedProduct}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              onSelect={(id: number) => {
                const product = products.find((p) => p.id === id);
                if (!product) return;
                cart.addProduct(product);
                setSelectedProduct(null);
                if (!unitConversions[id]) void loadUnitConversions(id);
                if (!isMobile) {
                  selectRef.current?.blur();
                  setTimeout(() => selectRef.current?.focus(), 0);
                } else {
                  selectRef.current?.blur();
                }
              }}
              options={products
                .filter((p) => p.active)
                .map((p) => ({
                  value: p.id,
                  label: ` ${p.sku} · ${p.name} · ${p.barcodes}`,
                }))}
            />

            <PurchaseCartTable
              items={cart.items}
              onQuantityChange={cart.updateQuantity}
              onCostChange={cart.updateCost}
              onLotChange={cart.updateLot}
              onExpirationChange={cart.updateExpiration}
              onRemove={cart.removeProduct}
            />
          </Card>

          {isCompact ? (
            <>
              <div
                style={{
                  position: "sticky",
                  bottom: 0,
                  zIndex: 10,
                  background: "#fff",
                  borderTop: "1px solid #f0f0f0",
                  padding: "10px 0 4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: "#888" }}>Total</div>
                  <strong style={{ fontSize: 18 }}>
                    {formatCurrency(cart.total())}
                  </strong>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    icon={<ShoppingCartOutlined />}
                    onClick={() => setSummaryOpen(true)}
                    disabled={cart.items.length === 0}
                  >
                    Resumen
                  </Button>
                  <Button
                    type="primary"
                    loading={creating}
                    disabled={isSubmitDisabled}
                    onClick={submitPurchase}
                  >
                    Registrar
                  </Button>
                </div>
              </div>

              <Drawer
                title="Resumen de la compra"
                placement="bottom"
                height="auto"
                open={summaryOpen}
                onClose={() => setSummaryOpen(false)}
                styles={{ body: { paddingBottom: 32 } }}
              >
                {summaryPanel}
              </Drawer>
            </>
          ) : (
            <Card
              type="inner"
              title="Resumen de la compra"
              style={{ position: "sticky", top: 24, borderRadius: 8 }}
            >
              <Row justify="center">
                <Col xs={24} md={12} lg={8}>
                  {summaryPanel}
                </Col>
              </Row>
            </Card>
          )}
        </div>
      </Card>
    </>
  );
}