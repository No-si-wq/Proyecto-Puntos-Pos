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
} from "antd";

import { useCustomers } from "../../hooks/useCustomers";
import { useSales } from "../../hooks/useSales";
import { useCartSale } from "../../hooks/useCartSale";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";
import { saleStore } from "../../store/sale.store";
import { SaleCartTable } from "../../components/tables/SaleCartTable";
import { formatCurrency } from "../../utils/formatters";
import { MobileBottomBar } from "../ButtonBar/ButtonBar";
import { useDeviceType } from "../../hooks/useDeviceType";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import { useRequiredWarehouse } from "../../hooks/useRequiredWarehouse";
import { useWarehouseProducts } from "../../hooks/useWarehouseProducts";

import PageHeader from "../../components/common/PageHeader";

export default function Sales() {
  const { customers, reload: reloadCustomers } = useCustomers();
  const warehouseId = useRequiredWarehouse();
  const { products, reload: reloadProducts } = useWarehouseProducts();
  const { isMobile, isTablet, device } = useDeviceType();
  const tableSpan =
    device === "desktop" ? 16 :
    device === "tablet" ? 14 :
    24;

  const summarySpan =
    device === "desktop" ? 8 :
    device === "tablet" ? 10 :
    24;
  const sizes = useResponsiveSizes();
  const { create, creating } = useSales();
  const [selectedProductId, setSelectedProductId] =
  useState<number | null>(null);
  const selectRef = useRef<any>(null);
  const cart = useCartSale();

  useEffect(() => {
    cart.clear();
  }, [warehouseId]);

  const { onKey } = useBarcodeScanner({
    onProductFound: (product) => {
      const item = cart.items.find(
        (i) => i.productId === product.id
      );

      if (item) {
        cart.updateQuantity(
          product.id,
          item.quantity + 1
        );
        return; 
      }

      cart.addProduct(product)
    }
  })

  const sale = saleStore();
  const selectedCustomer = customers.find(
    (c) => c.id === sale.customerId
  );

  const availablePoints = selectedCustomer?.points?.balance ?? 0;

  async function submitSale() {
    if (cart.items.length === 0) {
      message.warning("El carrito está vacío");
      return;
    }

    if (sale.pointsUsed > availablePoints) {
      message.error("Puntos insuficientes");
      return;
    }

    try {
      const result = await create({
        customerId: sale.customerId,
        pointsUsed: sale.pointsUsed,
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });

      await Promise.all([
        reloadProducts(),
        reloadCustomers(),
      ]);

      cart.clear();
      sale.reset();

      message.success(
        result?.pointsEarned
          ? `Venta realizada. Puntos ganados: ${result.pointsEarned}`
          : "Venta realizada"
      );
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ?? "Error creando venta"
      );
    }
  }

  return (
    <>
      <PageHeader
        title="Ventas"
        subtitle="Punto de venta"
      />

      <Row gutter={sizes.gutter} align="top">
        
        <Col span={tableSpan}>
          <Card
            title="Productos"
            bodyStyle={{ 
              padding: sizes.cardPadding
            }}
          >
            <Input
              autoFocus
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  onKey(value[value.length - 1]);
                }
                e.target.value = "";
              }}
              style={{
                position: "absolute",
                opacity: 0,
                height: 0,
                width: 0,
              }}
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
                  const product = products.find(
                    (p) => p.id === id
                  );
                  if (product) {
                    cart.addProduct(product);
                  }

                  setSelectedProductId(null);
                  selectRef.current?.blur();
                  setTimeout(() => {
                    selectRef.current?.focus();
                  }, 0);
                }}
                filterOption={(input, option) => {
                  const label = option?.label as string;
                  return label
                    ?.toLowerCase()
                    .includes(input.toLowerCase());
                }}
                options={products
                  .filter((p) => p.active)
                  .map((p) => ({
                    value: p.id,
                    label: `${p.name} · Existencia: ${p.stock}`,
                    disabled: p.stock <= 0,
                  }))}
                />
              </div>

            {isMobile && (
              <div style={{ marginBottom: 16 }}>
                <Select
                  showSearch
                  virtual
                  allowClear
                  size={sizes.select}
                  placeholder="Buscar cliente"
                  value={sale.customerId}
                  listHeight={sizes.selectListHeight}
                  dropdownMatchSelectWidth
                  optionFilterProp="label"
                  onChange={(v) => sale.setCustomer(v ?? undefined)}
                  style={{ width: "100%" }}
                  filterOption={(input, option) => {
                    const label = option?.label as String
                    return label
                      ?.toLocaleLowerCase()
                      .includes(input.toLocaleLowerCase());
                  }}
                  options={customers
                    .filter((c) => c.active)
                    .map((c) => ({
                      value: c.id,
                      label: `${c.name} · ${c.points?.balance ?? 0} pts`,
                    }))}
                />
                  {selectedCustomer && (
                    <>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#666",
                        }}
                      >
                        Puntos disponibles:{" "}
                        <strong>
                          {availablePoints}
                        </strong>
                      </div>

                      <InputNumber
                        inputMode="numeric"
                        pattern="[0-9]*"
                        size="large"
                        min={0}
                        max={availablePoints}
                        value={sale.pointsUsed}
                        onChange={(v) =>
                          sale.setPoints(
                            Math.min(
                              Number(v) || 0,
                              availablePoints
                            )
                          )
                        }
                        placeholder="Puntos a usar"
                        style={{ width: "100%" }}
                      />
                    </>
                  )}
              </div>
            )}
            <SaleCartTable
              items={cart.items}
              onQuantityChange={cart.updateQuantity}
              onRemove={cart.removeProduct}
            />
          </Card>
        </Col>

        {isMobile && (
          <MobileBottomBar
            subtotal={cart.total()}
            pointsUsed={sale.pointsUsed}
            disabled={cart.items.length === 0}
            loading={creating}
            onConfirm={submitSale}

          />
        )}

        {!isMobile && (
          <Col span={summarySpan}>
            <div
              style={{
                position: "sticky",
                top: isTablet ? 16 : 32,
                minHeight: isTablet ? 420 : undefined
              }}
            >
              <Card
                title="Resumen de la venta"
                bodyStyle={{
                  padding: sizes.cardPadding,
                }}
                style={{
                  borderRadius: 8,
                  boxShadow:
                    "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: sizes.gap,
                  }}
                >
                <Select
                  showSearch
                  allowClear
                  listHeight={sizes.selectListHeight}
                  size={sizes.select}
                  placeholder="Buscar cliente..."
                  value={sale.customerId}
                  onChange={(v) => sale.setCustomer(v ?? undefined)}
                  style={{ width: "100%", marginBottom: isTablet ? 20 : 16 }}
                  optionFilterProp="label"
                  filterOption={(input, option) => {
                    const label = option?.label as string;
                    return label
                      ?.toLowerCase()
                      .includes(input.toLowerCase());
                  }}
                  options={customers
                    .filter((c) => c.active)
                    .map((c) => ({
                      value: c.id,
                      label: `${c.name} · ${
                        c.points?.balance ?? 0
                      } pts`,
                    }))}
                />

                  {selectedCustomer && (
                    <>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#666",
                        }}
                      >
                        Puntos disponibles:{" "}
                        <strong>
                          {availablePoints}
                        </strong>
                      </div>

                      <InputNumber
                        inputMode="numeric"
                        size={sizes.input}
                        min={0}
                        max={availablePoints}
                        value={sale.pointsUsed}
                        onChange={(v) =>
                          sale.setPoints(
                            Math.min(
                              Number(v) || 0,
                              availablePoints
                            )
                          )
                        }
                        placeholder="Puntos a usar"
                        style={{ width: "100%" }}
                      />
                    </>
                  )}

                  <div
                    style={{
                      textAlign: "center",
                      marginTop: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: "#888",
                        letterSpacing: 1,
                      }}
                    >
                      TOTAL A PAGAR
                    </div>

                    <div
                      style={{
                        fontSize: sizes.totalFontSize,
                        fontWeight: 700,
                        transition: "all 0.2s ease"
                      }}
                    >
                      {formatCurrency(
                        cart.total()
                      )}
                    </div>
                  </div>

                  {selectedCustomer &&
                    sale.pointsUsed > 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          fontSize: 14,
                        }}
                      >
                        Descuento aplicado:{" "}
                        <strong>
                          −
                          {formatCurrency(
                            sale.pointsUsed
                          )}
                        </strong>
                      </div>
                    )}

                  <Button
                    type="primary"
                    size={sizes.button}
                    block
                    disabled={
                      cart.items.length === 0
                    }
                    loading={creating}
                    onClick={submitSale}
                  >
                    Confirmar venta
                  </Button>
                </div>
              </Card>
            </div>
          </Col>
        )}
      </Row>
    </>
  );
}