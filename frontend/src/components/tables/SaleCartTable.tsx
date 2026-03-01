import { Table, InputNumber, Button, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency } from "../../utils/formatters";
import type { SaleCartItem } from "../../store/saleCart.store";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";

interface Props {
  items: SaleCartItem[];
  onQuantityChange: (id: number, q: number) => void;
  onRemove: (id: number) => void;
  onDiscountChange: (
    id: number,
    type: "NONE" | "PERCENTAGE" | "FIXED",
    value: number
  ) => void;
}

export function SaleCartTable({
  items,
  onQuantityChange,
  onRemove,
  onDiscountChange,
}: Props) {
  const sizes = useResponsiveSizes();

  const columns: ColumnsType<SaleCartItem> = [
    {
      title: "Producto",
      dataIndex: "name",
      ellipsis: true,
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