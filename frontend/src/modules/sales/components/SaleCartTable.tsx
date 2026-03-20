import { Table, InputNumber, Button, Select, Card } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency } from "../../../core/utils/formatters";
import type { SaleCartItem } from "../types/saleCart.store";
import { useResponsiveSizes } from "../../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import type { PriceList } from "../../priceLists/pricelist";
import type { Product } from "../../products/product";

interface Props {
  items: SaleCartItem[];
  onQuantityChange: (id: number, q: number) => void;
  onRemove: (id: number) => void;
  onDiscountChange: (
    id: number,
    type: "NONE" | "PERCENTAGE" | "FIXED",
    value: number
  ) => void;
  onPriceListChange: (
    productId: number,
    priceListId: number | undefined,
    resolvedPrice: number
  ) => void;
  priceLists: PriceList[];
  products: Product[];
}

export function SaleCartTable({
  items,
  onQuantityChange,
  onRemove,
  onDiscountChange,
  onPriceListChange,
  priceLists,
  products,
}: Props) {
  const sizes = useResponsiveSizes();
  const { isMobile } = useDeviceType();

  function getAvailableOptions(productId: number) {
    const product = products.find((p) => p.id === productId);
    const productPriceListIds = new Set(
      product?.prices
        ?.filter((pp) => pp.active)
        .map((pp) => pp.priceListId) ?? []
    );
    return priceLists
      .filter((pl) => pl.active && productPriceListIds.has(pl.id))
      .map((pl) => ({ value: pl.id, label: pl.name }));
  }

  function handlePriceListChange(
    item: SaleCartItem,
    v: number | undefined
  ) {
    const product = products.find((p) => p.id === item.productId);
    const customPrice = v
      ? product?.prices?.find((pp) => pp.priceListId === v)?.price
      : undefined;
    const resolvedPrice =
      customPrice !== undefined
        ? Number(customPrice)
        : Number(product?.price ?? item.price);
    onPriceListChange(item.productId, v, resolvedPrice);
  }

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((i) => {
          const taxPercent = (i.tax * 100).toFixed(0);
          const taxAmount = i.price * i.quantity * i.tax;

          return (
            <Card
              key={i.productId}
              size="small"
              styles={{
                body: { padding: "10px 12px" },
              }}
              extra={
                <Button
                  danger
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => onRemove(i.productId)}
                />
              }
              title={
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {i.name}
                </span>
              }
            >
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 2 }}>
                  Lista de precios
                </label>
                <Select
                  allowClear
                  placeholder="Base"
                  style={{ width: "100%" }}
                  value={i.priceListId ?? undefined}
                  onChange={(v) => handlePriceListChange(i, v ?? undefined)}
                  options={getAvailableOptions(i.productId)}
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 2 }}>
                    Cantidad
                  </label>
                  <InputNumber
                    min={1}
                    style={{ width: "100%" }}
                    value={i.quantity}
                    onChange={(v) => onQuantityChange(i.productId, Number(v ?? 1))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 2 }}>
                    Precio unitario
                  </label>
                  <div style={{ paddingTop: 6, fontWeight: 500 }}>
                    {formatCurrency(i.price)}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 2 }}>
                  Descuento
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  <Select
                    value={i.discountType}
                    style={{ width: 110 }}
                    onChange={(type) =>
                      onDiscountChange(i.productId, type, i.discountValue)
                    }
                    options={[
                      { value: "NONE", label: "Ninguno" },
                      { value: "PERCENTAGE", label: "%" },
                      { value: "FIXED", label: "Monto" },
                    ]}
                  />
                  <InputNumber
                    min={0}
                    style={{ flex: 1 }}
                    value={i.discountValue}
                    disabled={i.discountType === "NONE"}
                    onChange={(v) =>
                      onDiscountChange(i.productId, i.discountType, Number(v ?? 0))
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  borderTop: "1px solid #f0f0f0",
                  paddingTop: 8,
                  marginTop: 4,
                }}
              >
                <div style={{ fontSize: 12, color: "#888" }}>
                  <div>Impuesto ({taxPercent}%): {formatCurrency(taxAmount)}</div>
                  {i.discountAmount > 0 && (
                    <div style={{ color: "#ff4d4f" }}>
                      Descuento: −{formatCurrency(i.discountAmount)}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#888" }}>Subtotal</div>
                  <strong style={{ fontSize: 16 }}>
                    {formatCurrency(i.lineSubtotal)}
                  </strong>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  const columns: ColumnsType<SaleCartItem> = [
    {
      title: "Producto",
      dataIndex: "name",
      ellipsis: true,
    },
    {
      title: "Lista de precios",
      width: 170,
      render: (_, i) => (
        <Select
          allowClear
          placeholder="Base"
          style={{ width: "100%" }}
          value={i.priceListId ?? undefined}
          onChange={(v) => handlePriceListChange(i, v ?? undefined)}
          options={getAvailableOptions(i.productId)}
        />
      ),
    },
    {
      title: "Precio",
      width: 120,
      align: "right",
      render: (_, i) => formatCurrency(i.price),
    },
    {
      title: "Impuesto",
      width: 140,
      align: "right",
      render: (_, i) => {
        const taxAmount = i.price * i.quantity * i.tax;
        const taxPercent = (i.tax * 100).toFixed(0);
        return (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#888" }}>{taxPercent}%</div>
            <div>{formatCurrency(taxAmount)}</div>
          </div>
        );
      },
    },
    {
      title: "Cantidad",
      width: 110,
      align: "center",
      render: (_, i) => (
        <InputNumber
          min={1}
          style={{ width: "100%" }}
          value={i.quantity}
          onChange={(v) => onQuantityChange(i.productId, Number(v ?? 1))}
        />
      ),
    },
    {
      title: "Descuento",
      width: 220,
      render: (_, i) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Select
            value={i.discountType}
            style={{ width: 110 }}
            onChange={(type) =>
              onDiscountChange(i.productId, type, i.discountValue)
            }
            options={[
              { value: "NONE", label: "Ninguno" },
              { value: "PERCENTAGE", label: "%" },
              { value: "FIXED", label: "Monto" },
            ]}
          />
          <InputNumber
            min={0}
            style={{ flex: 1 }}
            value={i.discountValue}
            onChange={(v) =>
              onDiscountChange(i.productId, i.discountType, Number(v ?? 0))
            }
          />
        </div>
      ),
    },
    {
      title: "Subtotal",
      width: 170,
      align: "right",
      render: (_, i) => (
        <div style={{ textAlign: "right" }}>
          {i.discountAmount > 0 && (
            <div style={{ fontSize: 12, color: "#999" }}>
              −{formatCurrency(i.discountAmount)}
            </div>
          )}
          <strong>{formatCurrency(i.lineSubtotal)}</strong>
        </div>
      ),
    },
    {
      title: "",
      width: 80,
      align: "center",
      render: (_, i) => (
        <Button danger type="text" onClick={() => onRemove(i.productId)}>
          Quitar
        </Button>
      ),
    },
  ];

  return (
    <Table
      rowKey={(i) => i.productId}
      dataSource={items}
      columns={columns}
      pagination={false}
      size={sizes.table}
      bordered
      scroll={{ x: "max-content" }}
    />
  );
}