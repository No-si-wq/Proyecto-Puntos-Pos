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
  Divider
} from "antd";

import { useCustomers } from "../../hooks/useCustomers";
import { useSales } from "../../hooks/useSales";
import { useCartSale } from "../../hooks/useCartSale";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";
import { saleStore } from "../../store/sale.store";
import { SaleCartTable } from "../../components/tables/SaleCartTable";
import { formatCurrency } from "../../utils/formatters";
import { useDeviceType } from "../../hooks/useDeviceType";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import { useRequiredWarehouse } from "../../hooks/useRequiredWarehouse";
import { useWarehouseProducts } from "../../hooks/useWarehouseProducts";
import type { SalePaymentMethod } from "../../types/sale";

import PageHeader from "../../components/common/PageHeader";

export default function Sales() {
  const { customers, reload: reloadCustomers } = useCustomers();
  const warehouseId = useRequiredWarehouse();
  const { products, reload: reloadProducts } = useWarehouseProducts();
  const [paymentMethod, setPaymentMethod] =
  useState<SalePaymentMethod>("CASH");

  const [dueDate, setDueDate] = useState<string>();
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

    const finalTotal =
      cart.subtotal() - sale.pointsUsed;

    if (finalTotal < 0) {
      message.error("Total inválido");
      return;
    }

    try {
      const result = await create({
        customerId: sale.customerId,
        pointsUsed: sale.pointsUsed,
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          discountType: i.discountType,
          discountValue: i.discountValue,
        })),
        paymentMethod,
        dueDate,
      });

      await Promise.all([
        reloadProducts(),
        reloadCustomers(),
      ]);

      cart.clear();
      sale.reset();
      setPaymentMethod("CASH");
      setDueDate(undefined);

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

  if (isMobile) {
    return (
      <div
        style={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
        }}
      >
        <PageHeader
          title="Ventas"
          subtitle="Punto de venta"
        />

        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #f0f0f0",
            background: "#fff",
          }}
        >
          <Select
            ref={selectRef}
            showSearch
            allowClear
            disabled={!warehouseId}
            placeholder="Buscar producto"
            size={sizes.select}
            style={{ width: "100%", marginBottom: 12 }}
            value={selectedProductId}
            onChange={setSelectedProductId}
            onSelect={(id: number) => {
              const product = products.find(
                (p) => p.id === id
              );
              if (product) cart.addProduct(product);
              setSelectedProductId(null);
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
                label: `${p.name} · ${p.stock}`,
                disabled: p.stock <= 0,
              }))}
          />

          <Select
            showSearch
            allowClear
            size={sizes.select}
            placeholder="Cliente"
            value={sale.customerId}
            onChange={(v) => sale.setCustomer(v ?? undefined)}
            style={{ width: "100%", marginBottom: 8 }}
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
                label: `${c.name} · ${c.points?.balance ?? 0} pts`,
              }))}
          />

          <div
            style={{
              marginBottom: 16
            }}
          >
            {selectedCustomer && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, color: "#666" }}>
                  Puntos disponibles:{" "}
                  <strong>{availablePoints}</strong>
                </div>

                <InputNumber
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
                  style={{ width: "100%", marginTop: 6 }}
                />
              </div>
            )}
          </div>

          <Select
            value={paymentMethod}
            onChange={(value) => {
              setPaymentMethod(value);
              if (value !== "CREDIT") {
                setDueDate(undefined);
              }
            }}
            size={sizes.select}
            style={{ width: "100%" }}
            options={[
              { label: "Efectivo", value: "CASH" },
              { label: "Tarjeta", value: "CARD" },
              { label: "Transferencia", value: "TRANSFER" },
              { label: "Crédito", value: "CREDIT" },
            ]}
          />

          {paymentMethod === "CREDIT" && (
            <DatePicker
              style={{ width: "100%", marginTop: 8 }}
              size={sizes.input}
              placeholder="Fecha de vencimiento"
              onChange={(date) =>
                setDueDate(date?.toISOString())
              }
            />
          )}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            background: "#fafafa",
          }}
        >
          <SaleCartTable
            items={cart.items}
            onQuantityChange={cart.updateQuantity}
            onRemove={cart.removeProduct}
            onDiscountChange={cart.updateDiscount}
          />
        </div>

        <div
          style={{
            borderTop: "1px solid #eee",
            padding: 16,
            paddingBottom:
              "calc(16px + env(safe-area-inset-bottom))",
            background: "#fff",
            boxShadow:
              "0 -4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 13, color: "#666" }}>
              Total
            </span>
            <strong style={{ fontSize: 20 }}>
              {formatCurrency(
                cart.subtotal() - sale.pointsUsed
              )}
            </strong>
          </div>

          <Button
            type="primary"
            block
            size="large"
            disabled={
              cart.items.length === 0 ||
              (paymentMethod === "CREDIT" &&
                (!sale.customerId || !dueDate))
            }
            loading={creating}
            onClick={submitSale}
          >
            Confirmar venta
          </Button>
        </div>
      </div>
    );
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
              padding: sizes.cardPadding,
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
            <SaleCartTable
              items={cart.items}
              onQuantityChange={cart.updateQuantity}
              onRemove={cart.removeProduct}
              onDiscountChange={cart.updateDiscount}
            />
          </Card>
        </Col>

        {!isMobile && (
          <Col span={summarySpan}>
            <div
              style={{
                position: "sticky",
                display: "flex",
                flexDirection: "column",
                gap: sizes.gap,
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
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
                    CLIENTE
                  </div>

                  <Select
                    showSearch
                    allowClear
                    listHeight={sizes.selectListHeight}
                    size={sizes.select}
                    placeholder="Seleccionar cliente"
                    value={sale.customerId}
                    onChange={(v) => sale.setCustomer(v ?? undefined)}
                    style={{ width: "100%" }}
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                      (option?.label as string)
                        ?.toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={customers
                      .filter((c) => c.active)
                      .map((c) => ({
                        value: c.id,
                        label: `${c.name} · ${c.points?.balance ?? 0} pts`,
                      }))}
                  />

                  {selectedCustomer && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 13, color: "#666" }}>
                        Puntos disponibles:{" "}
                        <strong>{availablePoints}</strong>
                      </div>

                      <InputNumber
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
                        style={{ width: "100%", marginTop: 6 }}
                      />
                    </div>
                  )}
                </div>

                <Divider style={{ margin: 0 }} />

                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
                    MÉTODO DE PAGO
                  </div>

                  <Select
                    value={paymentMethod}
                    onChange={(value) => {
                      setPaymentMethod(value);
                      if (value !== "CREDIT") {
                        setDueDate(undefined);
                      }
                    }}
                    size={sizes.select}
                    style={{ width: "100%" }}
                    options={[
                      { label: "Efectivo", value: "CASH" },
                      { label: "Tarjeta", value: "CARD" },
                      { label: "Transferencia", value: "TRANSFER" },
                      { label: "Crédito", value: "CREDIT" },
                    ]}
                  />

                  <div
                    style={{
                      marginTop: 10,
                      height: 70,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    {paymentMethod === "CREDIT" ? (
                      <>
                        <Tag color="orange" style={{ marginBottom: 6 }}>
                          Venta a crédito
                        </Tag>

                        <DatePicker
                          style={{ width: "100%" }}
                          size={sizes.input}
                          placeholder="Fecha de vencimiento"
                          onChange={(date) =>
                            setDueDate(date?.toISOString())
                          }
                        />
                      </>
                    ) : (
                      <div style={{ height: 32 }} />
                    )}
                  </div>
                </div>

                <Divider style={{ margin: 0 }} />

                <div style={{ textAlign: "right", marginBottom: 6 }}>
                  <div>
                    Subtotal bruto:{" "}
                    <strong>
                      {formatCurrency(cart.grossSubtotal())}
                    </strong>
                  </div>

                  {cart.grossSubtotal() !== cart.subtotal() && (
                    <div>
                      Descuento por productos:{" "}
                      <strong>
                        −
                        {formatCurrency(
                          cart.grossSubtotal() -
                            cart.subtotal()
                        )}
                      </strong>
                    </div>
                  )}

                  {sale.pointsUsed > 0 && (
                    <div>
                      Descuento por puntos:{" "}
                      <strong>
                        −{formatCurrency(sale.pointsUsed)}
                      </strong>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    fontSize: sizes.totalFontSize + 6,
                    fontWeight: 700,
                    marginTop: 6,
                  }}
                >
                  {formatCurrency(
                    cart.subtotal() - sale.pointsUsed
                  )}
                </div>

                <Button
                  type="primary"
                  size={sizes.button}
                  block
                  disabled={
                    cart.items.length === 0 ||
                    (paymentMethod === "CREDIT" &&
                      (!sale.customerId || !dueDate))
                  }
                  loading={creating}
                  onClick={submitSale}
                >
                  Confirmar venta
                </Button>
              </Card>
            </div>
          </Col>
        )}
      </Row>
    </>
  );
}