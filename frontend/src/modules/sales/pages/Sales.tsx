import { useState, useRef, useEffect } from "react";

import { 
  Card, 
  Select, 
  InputNumber,
  message, 
  Input, 
  Row, 
  Col,
  Button,
  DatePicker,
  Tag,
  Divider,
  Drawer,
} from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";

import { useDebouncedCallback } from "use-debounce";
import { useCustomers } from "../../customers/useCustomers";
import { useSales } from "../hooks/useSales";
import { saleCartStore } from "../types/saleCart.store";
import { useBarcodeScanner } from "../../../core/hooks/useBarcodeScanner";
import { saleStore } from "../types/sale.store";
import { SaleCartTable } from "../components/SaleCartTable";
import { formatCurrency } from "../../../core/utils/formatters";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import { useResponsiveSizes } from "../../../core/hooks/useResponsiveSizes";
import { useRequiredWarehouse } from "../../warehouses/useRequiredWarehouse";
import { useWarehouseProducts } from "../../warehouses/useWarehouseProducts";
import { usePriceLists } from "../../priceLists/hooks/usePriceList";
import type { SalePaymentMethod } from "../types/sale";

import PageHeader from "../../../core/components/common/PageHeader";

export default function Sales() {
  const { customers, reload: reloadCustomers, loading: loadingCustomers, setFilters: setFiltersCustomer } = useCustomers();
  const [sellerId, setSellerId] = useState<number | undefined>();
  const warehouseId = useRequiredWarehouse();
  const { products, reload: reloadProducts } = useWarehouseProducts();
  const { priceLists = [] } = usePriceLists();

  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>("CASH");
  const [dueDate, setDueDate] = useState<string>();
  const [summaryOpen, setSummaryOpen] = useState(false);

  const { isMobile, isTablet, device } = useDeviceType();
  const tableSpan   = device === "desktop" ? 16 : device === "tablet" ? 14 : 24;
  const summarySpan = device === "desktop" ? 8  : device === "tablet" ? 10 : 24;
  const sizes = useResponsiveSizes();

  const { create, creating } = useSales();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const selectRef = useRef<any>(null);
  const cart = saleCartStore();

  useEffect(() => {
    cart.clear();
  }, [warehouseId]);

  const { onKey } = useBarcodeScanner({
    onProductFound: (product) => {
      const item = cart.items.find((i) => i.productId === product.id);
      if (item) {
        cart.updateQuantity(product.id, item.quantity + 1);
        return;
      }
      cart.addProduct(product, undefined);
    },
  });

  const sale = saleStore();
  const selectedCustomer = customers.find((c) => c.id === sale.customerId);
  const availablePoints = selectedCustomer?.points?.balance ?? 0;
  const estimatedCommission = cart.totalCommission();

  const handleSearch = useDebouncedCallback((value: string) => {
    setFiltersCustomer({ search: value });
  }, 400);

  const isSubmitDisabled =
    cart.items.length === 0 ||
    (paymentMethod === "CREDIT" && (!sale.customerId || !dueDate));

  async function submitSale() {
    if (cart.items.length === 0) {
      message.warning("El carrito está vacío");
      return;
    }
    if (sale.pointsUsed > availablePoints) {
      message.error("Puntos insuficientes");
      return;
    }
    if (paymentMethod === "CREDIT") {
      if (!sale.customerId) {
        message.error("Debe seleccionar cliente para crédito");
        return;
      }
      if (!dueDate) {
        message.error("Debe seleccionar fecha de vencimiento");
        return;
      }
    }

    const pointsDiscount = sale.pointsUsed;
    const finalTotal = cart.subtotal() - pointsDiscount;
    if (finalTotal < 0) {
      message.error("Total inválido");
      return;
    }

    try {
      const result = await create({
        customerId: sale.customerId,
        pointsUsed: sale.pointsUsed,
        sellerId,
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          discountType: i.discountType,
          discountValue: i.discountValue,
          priceListId: i.priceListId,
        })),
        paymentMethod,
        dueDate,
      });

      await Promise.all([reloadProducts(), reloadCustomers()]);

      cart.clear();
      sale.reset();
      setPaymentMethod("CASH");
      setSellerId(undefined);
      setDueDate(undefined);
      setSummaryOpen(false);

      message.success(
        result?.pointsEarned
          ? `Venta realizada. Puntos ganados: ${result.pointsEarned}`
          : "Venta realizada"
      );
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? "Error creando venta");
    }
  }

  const totalFinal = cart.subtotal() - (sale.pointsUsed) + cart.totalTax();

  const summaryPanel = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      <div>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>CLIENTE</div>
        <Select
          showSearch
          allowClear
          listHeight={sizes.selectListHeight}
          size={sizes.select}
          placeholder="Seleccionar cliente"
          value={sale.customerId}
          onChange={(v) => sale.setCustomer(v ?? undefined)}
          style={{ width: "100%" }}
          loading={loadingCustomers}
          onSearch={handleSearch}
          filterOption={false}
          options={customers
            .filter((c) => c.active)
            .map((c) => ({ value: c.id, label: `${c.dni} - ${c.name}` }))}
        />
      </div>

      {selectedCustomer && (
        <div style={{ padding: "8px 10px", background: "#f6ffed", borderRadius: 6, border: "1px solid #b7eb8f" }}>
          <Row align="middle" gutter={8}>
            <Col flex={1}>
              <span style={{ fontSize: 12, color: "#52c41a" }}>
                Puntos disponibles: <strong>{availablePoints}</strong>
              </span>
            </Col>
            <Col>
              <InputNumber
                size="small"
                min={0}
                max={availablePoints}
                value={sale.pointsUsed}
                onChange={(v) => sale.setPoints(Math.min(Number(v) || 0, availablePoints))}
                placeholder="Usar puntos"
                style={{ width: 110 }}
              />
            </Col>
          </Row>
        </div>
      )}

      <Divider style={{ margin: "0" }} />

      <div>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>MÉTODO DE PAGO</div>
        <Row gutter={8}>
          <Col span={paymentMethod === "CREDIT" ? 12 : 24}>
            <Select
              value={paymentMethod}
              onChange={(value) => {
                setPaymentMethod(value);
                if (value !== "CREDIT") setDueDate(undefined);
              }}
              size={sizes.select}
              style={{ width: "100%" }}
              options={[
                { label: "Efectivo",      value: "CASH"     },
                { label: "Tarjeta",       value: "CARD"     },
                { label: "Transferencia", value: "TRANSFER" },
                { label: "Crédito",       value: "CREDIT"   },
              ]}
            />
          </Col>
          {paymentMethod === "CREDIT" && (
            <Col span={12}>
              <DatePicker
                style={{ width: "100%" }}
                size={sizes.input}
                placeholder="Vencimiento"
                onChange={(date) => setDueDate(date?.toISOString())}
              />
            </Col>
          )}
        </Row>
        {paymentMethod === "CREDIT" && (
          <Tag color="orange" style={{ marginTop: 8 }}>Venta a crédito</Tag>
        )}
      </div>

      <Divider style={{ margin: "0" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#666" }}>Subtotal bruto</span>
          <strong>{formatCurrency(cart.grossSubtotal())}</strong>
        </div>

        {cart.totalTax() > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666" }}>Impuestos</span>
            <strong style={{ color: "#faad14" }}>{formatCurrency(cart.totalTax())}</strong>
          </div>
        )}

        {cart.grossSubtotal() !== cart.subtotal() && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666" }}>Descuento productos</span>
            <strong style={{ color: "#ff4d4f" }}>−{formatCurrency(cart.grossSubtotal() - cart.subtotal())}</strong>
          </div>
        )}

        {sale.pointsUsed > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666" }}>Descuento puntos</span>
            <strong style={{ color: "#ff4d4f" }}>−{formatCurrency(sale.pointsUsed)}</strong>
          </div>
        )}

        {estimatedCommission > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#52c41a" }}>Comisión estimada</span>
            <strong style={{ color: "#52c41a" }}>{formatCurrency(estimatedCommission)}</strong>
          </div>
        )}
      </div>

      <Divider style={{ margin: "0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ color: "#888", fontSize: 13 }}>Total</span>
        <span style={{ fontSize: sizes.totalFontSize + 6, fontWeight: 700 }}>
          {formatCurrency(totalFinal)}
        </span>
      </div>

      <Button
        type="primary"
        size={sizes.button}
        block
        disabled={isSubmitDisabled}
        loading={creating}
        onClick={submitSale}
      >
        Confirmar venta
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#fff" }}>
          <PageHeader title="Ventas" subtitle="Punto de venta" />

          <div style={{ padding: 16, borderBottom: "1px solid #f0f0f0", background: "#fff" }}>
            <Select
              ref={selectRef}
              showSearch
              allowClear
              disabled={!warehouseId}
              placeholder="Buscar producto"
              size={sizes.select}
              style={{ width: "100%" }}
              value={selectedProductId}
              onChange={setSelectedProductId}
              onSelect={(id: number) => {
                const product = products.find((p) => p.id === id);
                if (product) cart.addProduct(product, undefined);
                setSelectedProductId(null);
                selectRef.current?.blur();
              }}
              filterOption={(input, option) => {
                const label = option?.label as string;
                return label?.toLowerCase().includes(input.toLowerCase());
              }}
              options={products
                .filter((p) => p.active)
                .map((p) => ({
                  value: p.id,
                  label: `${p.sku} - ${p.name} - ${p.stock}`,
                  disabled: p.stock <= 0,
                }))}
            />
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 16, background: "#fafafa" }}>
            <SaleCartTable
              items={cart.items}
              onQuantityChange={cart.updateQuantity}
              onRemove={cart.removeProduct}
              onDiscountChange={cart.updateDiscount}
              onPriceListChange={(productId, priceListId, resolvedPrice) => {
                cart.updatePriceList(productId, priceListId);
                cart.updatePrice(productId, resolvedPrice);
              }}
              priceLists={priceLists}
              products={products}
            />
          </div>

          <div
            style={{
              position: "sticky",
              bottom: 0,
              zIndex: 10,
              background: "#fff",
              borderTop: "1px solid #f0f0f0",
              padding: "10px 16px calc(10px + env(safe-area-inset-bottom))",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#888" }}>Total</div>
              <strong style={{ fontSize: 18 }}>
                {formatCurrency(totalFinal)}
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
                onClick={submitSale}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>

        <Drawer
          title="Resumen de la venta"
          placement="bottom"
          height="auto"
          open={summaryOpen}
          onClose={() => setSummaryOpen(false)}
          styles={{ body: { paddingBottom: 32 } }}
        >
          {summaryPanel}
        </Drawer>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Ventas" subtitle="Punto de venta" />

      <Row gutter={sizes.gutter} align="top">
        <Col span={tableSpan}>
          <Card title="Productos" bodyStyle={{ padding: sizes.cardPadding }}>
            <Input
              autoFocus={!isMobile}
              onChange={(e) => {
                const value = e.target.value;
                if (value) onKey(value[value.length - 1]);
                e.target.value = "";
              }}
              style={{ position: "absolute", opacity: 0, height: 0, width: 0 }}
            />

            <div style={{ marginBottom: 20 }}>
              <Select
                ref={selectRef}
                showSearch
                allowClear
                autoClearSearchValue
                disabled={!warehouseId}
                placeholder="Buscar producto"
                size={sizes.select}
                listHeight={sizes.selectListHeight}
                style={{ width: "100%", marginBottom: isTablet ? 20 : 16 }}
                optionFilterProp="label"
                defaultActiveFirstOption
                value={selectedProductId}
                onChange={setSelectedProductId}
                onSelect={(id: number) => {
                  const product = products.find((p) => p.id === id);
                  if (product) cart.addProduct(product, undefined);
                  setSelectedProductId(null);
                  selectRef.current?.blur();
                  setTimeout(() => selectRef.current?.focus(), 0);
                }}
                filterOption={(input, option) => {
                  const label = option?.label as string;
                  return label?.toLowerCase().includes(input.toLowerCase());
                }}
                options={products
                  .filter((p) => p.active)
                  .map((p) => ({
                    value: p.id,
                    label: `${p.sku} - ${p.name} - Existencia: ${p.stock}`,
                    disabled: p.stock <= 0,
                  }))}
              />
            </div>

            <SaleCartTable
              items={cart.items}
              onQuantityChange={cart.updateQuantity}
              onRemove={cart.removeProduct}
              onDiscountChange={cart.updateDiscount}
              onPriceListChange={(productId, priceListId, resolvedPrice) => {
                cart.updatePriceList(productId, priceListId);
                cart.updatePrice(productId, resolvedPrice);
              }}
              priceLists={priceLists}
              products={products}
            />
          </Card>
        </Col>

        {!isMobile && (
          <Col span={summarySpan}>
            <div style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: sizes.gap }}>
              <Card
                size="small"
                bodyStyle={{ padding: sizes.cardPadding }}
                style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                {summaryPanel}
              </Card>
            </div>
          </Col>
        )}
      </Row>
    </>
  );
}