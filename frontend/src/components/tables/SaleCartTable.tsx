import { Table, InputNumber, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency } from "../../utils/formatters";
import type { SaleCartItem } from "../../store/saleCart.store";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";

interface Props {
  items: SaleCartItem[];
  onQuantityChange: (id: number, q: number) => void;
  onRemove: (id: number) => void;
}

export function SaleCartTable({
  items,
  onQuantityChange,
  onRemove,
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
      width: 130,
      align: "right",
      render: (_, i) =>
        formatCurrency(i.price),
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
      title: "Subtotal",
      width: 150,
      align: "right",
      render: (_, i) => (
        <strong>
          {formatCurrency(
            i.price * i.quantity
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
      bordered
      scroll={{ x: "max-content" }}
    />
  );
}