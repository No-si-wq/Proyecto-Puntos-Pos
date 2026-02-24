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
} from "antd";

import { usePurchases } from "../../hooks/usePurchases";
import { useRequiredWarehouse } from "../../hooks/useRequiredWarehouse";
import { useCartPurchase } from "../../hooks/useCartPurchase";
import { useSuppliers } from "../../hooks/useSuppliers";
import { formatCurrency } from "../../utils/formatters";
import { PurchaseCartTable } from "../../components/tables/PurchaseCartTable";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import { useWarehouseProducts } from "../../hooks/useWarehouseProducts";

import PageHeader from "../../components/common/PageHeader";

export default function Purchases() {
  const [supplierId, setSupplierId] = useState(undefined);
  const warehouseId = useRequiredWarehouse();
  const [selectedProduct, setSelectedProduct] =
    useState<number | null>(null);
  const { products, reload: reloadProducts } = useWarehouseProducts();
  const { create, creating  } = usePurchases();
  const selectRef = useRef<any>(null);
  const cart = useCartPurchase();
  const sizes = useResponsiveSizes();
  const { suppliers } = useSuppliers();

  const { onKey } = useBarcodeScanner({
    onProductFound: (product, meta) => {
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
      
      cart.addProduct(product, product.cost, {
        lot: meta?.lot,
        expiresAt: meta?.expiresAt,
      });
    }
  })

  useEffect(() => {
    cart.clear();
  }, [warehouseId]);

  async function submitPurchase() {
    if (!supplierId || cart.items.length === 0) {
      message.warning("Proveedor e items son requeridos");
      return;
    }

    try {
      await create({
        supplierId,
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          cost: Number(i.cost),
          expiresAt: i.expiresAt
            ? i.expiresAt.toISOString()
            : null,
        })),
      });

      await Promise.all([ 
        reloadProducts()
      ]);

      message.success("Compra registrada");
      cart.clear();
      setSupplierId(undefined);
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ??
          "Error registrando compra"
      );
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
          <Card
            type="inner"
            title="Provedores"
            style={{ marginBottom: 16 }}
          >
            <Row gutter={sizes.gutter}>
              <Col xs={24} md={12}>
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
                    return label
                      ?.toLowerCase()
                      .includes(input.toLowerCase());
                  }}
                  options={suppliers
                    .filter((s) => s.active)
                    .map((s) => ({
                      value: s.id,
                      label: s.name,
                    }))}
                />
              </Col>
            </Row>
          </Card>
          
          <Card
            type="inner"
            title="Productos"
            style={{ marginBottom: 16 }}
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
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
              onSelect={(id: number) => {
                const product = products.find(
                  (p) => p.id === id
                );

                if (!product) return;

                cart.addProduct(product);

                setSelectedProduct(null)
                selectRef.current?.blur();
                setTimeout(() => {
                  selectRef.current?.focus();
                }, 0);
              }}
              options={products
                .filter((p) => p.active)
                .map((p) => ({
                  value: p.id,
                  label: `${p.name} · Existencias: ${p.stock}`,
                }))}
            />

            <PurchaseCartTable
              items={cart.items}
              onQuantityChange={cart.updateQuantity}
              onExpirationChange={cart.updateExpiration}
              onRemove={cart.removeProduct}
            />
          </Card>

          <Card 
            type="inner" 
            title="Resumen de la compra"
            style={{
              position: "sticky",
              top: 24,
              borderRadius: 8,
            }}
          >
            <Row justify="center">
              <Col xs={24} md={12} lg={8}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div
                    style={{ 
                      fontSize: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span>Total</span>
                    <strong style={{ fontSize: sizes.totalFontSize }}>
                      {formatCurrency(cart.total())}
                    </strong>
                  </div>
                </div>

                <Divider />

                <Button
                  type="primary"
                  size={sizes.button}
                  block
                  loading={creating}
                  disabled={!supplierId || cart.items.length === 0}
                  onClick={submitPurchase}
                >
                  Registrar compra
                </Button>
              </Col>
            </Row>
          </Card>
        </div>
      </Card>
    </>
  );
}