import { Table, InputNumber, Button, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency } from "../../../core/utils/formatters";
import type { SaleCartItem } from "..//saleCart.store";
import { useResponsiveSizes } from "../../../core/hooks/useResponsiveSizes";

interface PriceList {
  id: number;
  name: string;
  active: boolean;
}

interface Product {
  id: number;
  price: number;
  prices?: { priceListId: number; price: number }[];
}

interface Props {
  items: SaleCartItem[];
  onQuantityChange: (id: number, q: number) => void;
  onRemove: (id: number) => void;
  onDiscountChange: (
    id: number,
    type: "NONE" | "PERCENTAGE" | "FIXED",
    value: number
  ) => void;
  onPriceListChange: (productId: number, priceListId: number | undefined, resolvedPrice: number) => void;
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

  const columns: ColumnsType<SaleCartItem> = [
    {
      title: "Producto",
      dataIndex: "name",
      ellipsis: true,
    },
    {
      title: "Lista de precios",
      width: 170,
      render: (_, i) => {
        const product = products.find((p) => p.id === i.productId);
        return (
          <Select
            allowClear
            placeholder="Base"
            style={{ width: "100%" }}
            value={i.priceListId ?? undefined}
            onChange={(v) => {
              const plId = v ?? undefined;
              const customPrice = plId
                ? product?.prices?.find((pp) => pp.priceListId === plId)?.price
                : undefined;
              const resolvedPrice =
                customPrice !== undefined
                  ? Number(customPrice)
                  : Number(product?.price ?? i.price);
              onPriceListChange(i.productId, plId, resolvedPrice);
            }}
            options={priceLists
              .filter((pl) => pl.active)
              .map((pl) => ({ value: pl.id, label: pl.name }))}
          />
        );
      },
    },
    {
      title: "Precio",
      width: 120,
      align: "right",
      render: (_, i) => formatCurrency(i.price),
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
          onChange={(v) =>
            onQuantityChange(i.productId, Number(v ?? 1))
          }
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
              onDiscountChange(
                i.productId,
                type,
                i.discountValue
              )
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
              onDiscountChange(
                i.productId,
                i.discountType,
                Number(v ?? 0)
              )
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
          <strong>
            {formatCurrency(i.lineSubtotal)}
          </strong>
        </div>
      ),
    },
    {
      title: "",
      width: 80,
      align: "center",
      render: (_, i) => (
        <Button
          danger
          type="text"
          onClick={() => onRemove(i.productId)}
        >
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