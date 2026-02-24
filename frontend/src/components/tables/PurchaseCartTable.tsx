import { Table, InputNumber, DatePicker, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { formatCurrency } from "../../utils/formatters";
import type { PurchaseCartItem } from "../../store/purchaseCart.store";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";

interface Props {
  items: PurchaseCartItem[];
  onQuantityChange: (id: number, q: number) => void;
  onExpirationChange: (
    id: number,
    date: Date | null
  ) => void;
  onRemove: (id: number) => void;
}

export function PurchaseCartTable({
  items,
  onQuantityChange,
  onExpirationChange,
  onRemove,
}: Props) {
  const sizes = useResponsiveSizes();
  const columns: ColumnsType<PurchaseCartItem> = [
    {
      title: "Producto",
      dataIndex: "name",
      ellipsis: true,
    },
    {
      title: "Costo",
      width: 140,
      align: "right",
      render: (_, i) => 
        formatCurrency(i.cost)
    },
    {
      title: "Cantidad",
      width: 120,
      align: "center",
      render: (_, i) => (
        <InputNumber
          min={1}
          style={{ width: "100%" }}
          value={i.quantity}
          onChange={(v) =>
            onQuantityChange(
              i.productId,
              Number(v ?? 1)
            )
          }
        />
      ),
    },
    {
      title: "Vence",
      width: 160,
      render: (_, i) => (
        <DatePicker
          style={{ width: "100%" }}
          value={
            i.expiresAt
              ? dayjs(i.expiresAt)
              : null
          }
          onChange={(d) =>
            onExpirationChange(
              i.productId,
              d ? d.toDate() : null
            )
          }
        />
      ),
    },
    {
      title: "Subtotal",
      width: 150,
      align: "right",
      render: (_, i) => (
        <strong>
          {formatCurrency(
            i.cost * i.quantity
          )}
        </strong>
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
          onClick={() =>
            onRemove(i.productId)
          }
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
      scroll={{ x: "max-content" }}
      locale={{
        emptyText:
          "No hay productos agregados",
      }}
    />
  );
}