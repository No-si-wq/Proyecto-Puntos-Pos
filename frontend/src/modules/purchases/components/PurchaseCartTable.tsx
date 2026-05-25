import { Table, InputNumber, DatePicker, Button, Card, Input } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { formatCurrency } from "../../../core/utils/formatters";
import type { PurchaseCartItem } from "../types/purchaseCart.store";
import { useResponsiveSizes } from "../../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../../core/hooks/useDeviceType";

interface Props {
  items: PurchaseCartItem[];
  onQuantityChange: (id: number, q: number) => void;
  onCostChange: (id: number, cost: number) => void;
  onLotChange: (id: number, lot: string) => void;
  onExpirationChange: (id: number, date: Date | null) => void;
  onRemove: (id: number) => void;
}

export function PurchaseCartTable({
  items,
  onQuantityChange,
  onCostChange,
  onExpirationChange,
  onRemove,
  onLotChange,
}: Props) {
  const sizes = useResponsiveSizes();
  const { isMobile } = useDeviceType();

  if (isMobile) {
    if (items.length === 0) {
      return (
        <div style={{ textAlign: "center", color: "#aaa", padding: "24px 0", fontSize: 13 }}>
          No hay productos agregados
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((i) => (
          <Card
            key={i.productId}
            size="small"
            styles={{ body: { padding: "10px 12px" } }}
            title={
              <span style={{ fontSize: 13, fontWeight: 600 }}>{i.name}</span>
            }
            extra={
              <Button
                danger
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => onRemove(i.productId)}
              />
            }
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 2 }}>
                  Costo unitario
                </label>
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: "100%" }}
                  value={i.cost}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(v) => parseFloat(v?.replace(/,/g, "") ?? "0")}
                  onChange={(v) => onCostChange(i.productId, Number(v ?? 0))}
                />
              </div>
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
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 2 }}>
                Fecha de vencimiento
              </label>
              <DatePicker
                style={{ width: "100%" }}
                value={i.expiresAt ? dayjs(i.expiresAt) : null}
                onChange={(d) => onExpirationChange(i.productId, d ? d.toDate() : null)}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 2 }}>
                Nº Lote
              </label>
              <Input
                placeholder="Ej: L-001"
                value={i.lotNumber ?? ""}
                onChange={(e) => onLotChange(i.productId, e.target.value)}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                borderTop: "1px solid #f0f0f0",
                paddingTop: 8,
              }}
            >
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#888" }}>Subtotal</div>
                <strong style={{ fontSize: 15 }}>
                  {formatCurrency(i.cost * i.quantity)}
                </strong>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

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
      render: (_, i) => (
        <InputNumber
          min={0}
          precision={2}
          style={{ width: "100%" }}
          value={i.cost}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          parser={(v) => parseFloat(v?.replace(/,/g, "") ?? "0")}
          onChange={(v) => onCostChange(i.productId, Number(v ?? 0))}
        />
      ),
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
          onChange={(v) => onQuantityChange(i.productId, Number(v ?? 1))}
        />
      ),
    },
    {
      title: "Nº Lote",
      width: 130,
      render: (_, i) => (
        <Input
          placeholder="Ej: L-001"
          value={i.lotNumber ?? ""}
          onChange={(e) => onLotChange(i.productId, e.target.value)}
        />
      ),
    },
    {
      title: "Vence",
      width: 160,
      render: (_, i) => (
        <DatePicker
          style={{ width: "100%" }}
          value={i.expiresAt ? dayjs(i.expiresAt) : null}
          onChange={(d) => onExpirationChange(i.productId, d ? d.toDate() : null)}
        />
      ),
    },
    {
      title: "Subtotal",
      width: 150,
      align: "right",
      render: (_, i) => <strong>{formatCurrency(i.cost * i.quantity)}</strong>,
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
      scroll={{ x: "max-content" }}
      locale={{ emptyText: "No hay productos agregados" }}
    />
  );
}