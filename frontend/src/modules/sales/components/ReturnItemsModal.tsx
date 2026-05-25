import { useState } from "react";
import {
  Modal, Table, InputNumber, Input, Button,
  Typography, Space, Alert, Divider,
} from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import type { SaleItems } from "../types/sale";
import type { ReturnItemInput } from "../types/sale";
import { formatCurrency } from "../../../core/utils/formatters";

const { Text } = Typography;

interface Props {
  open: boolean;
  items: SaleItems[];
  onConfirm: (items: ReturnItemInput[], reason: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// Calcula cuánto ya fue devuelto de un ítem
function alreadyReturned(item: SaleItems): number {
  return (item as any).returnItems?.reduce(
    (s: number, r: any) => s + r.quantity, 0
  ) ?? 0;
}

export default function ReturnItemsModal({
  open, items, onConfirm, onCancel, loading,
}: Props) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [reason, setReason] = useState("");

  // Ítems con stock devolvible
  const returnableItems = items.filter(
    (i) => i.quantity - alreadyReturned(i) > 0
  );

  function maxFor(item: SaleItems) {
    return item.quantity - alreadyReturned(item);
  }

  function setQty(saleItemId: number, val: number) {
    setQuantities((prev) => ({ ...prev, [saleItemId]: val }));
  }

  // Total de reembolso estimado
  const totalRefund = returnableItems.reduce((sum, item) => {
    const qty = quantities[item.id] ?? 0;
    if (qty <= 0) return sum;
    const unitTotal = item.lineTotal / item.quantity;
    return sum + unitTotal * qty;
  }, 0);

  const selectedItems = returnableItems
    .filter((i) => (quantities[i.id] ?? 0) > 0)
    .map((i) => ({ saleItemId: i.id, quantity: quantities[i.id] }));

  async function handleOk() {
    await onConfirm(selectedItems, reason);
    setQuantities({});
    setReason("");
  }

  function handleClose() {
    setQuantities({});
    setReason("");
    onCancel();
  }

  const columns = [
    {
      title: "Producto",
      dataIndex: ["product", "name"],
      ellipsis: true,
    },
    {
      title: "Vendido",
      dataIndex: "quantity",
      width: 75,
      align: "center" as const,
    },
    {
      title: "Devuelto",
      width: 80,
      align: "center" as const,
      render: (_: any, item: SaleItems) => {
        const prev = alreadyReturned(item);
        return prev > 0 ? (
          <Text type="secondary">{prev}</Text>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
    },
    {
      title: "A devolver",
      width: 120,
      align: "center" as const,
      render: (_: any, item: SaleItems) => {
        const max = maxFor(item);
        return (
          <InputNumber
            min={0}
            max={max}
            value={quantities[item.id] ?? 0}
            onChange={(v) => setQty(item.id, v ?? 0)}
            size="small"
            style={{ width: 70 }}
            disabled={max === 0}
          />
        );
      },
    },
    {
      title: "Reembolso",
      width: 110,
      align: "right" as const,
      render: (_: any, item: SaleItems) => {
        const qty = quantities[item.id] ?? 0;
        if (qty <= 0) return <Text type="secondary">—</Text>;
        const unitTotal = item.lineTotal / item.quantity;
        return <Text>{formatCurrency(unitTotal * qty)}</Text>;
      },
    },
  ];

  return (
    <Modal
      open={open}
      title={
        <Space>
          <RollbackOutlined />
          Devolución parcial
        </Space>
      }
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancelar
        </Button>,
        <Button
          key="ok"
          type="primary"
          danger
          icon={<RollbackOutlined />}
          loading={loading}
          disabled={selectedItems.length === 0}
          onClick={handleOk}
        >
          Confirmar devolución
        </Button>,
      ]}
      width={700}
    >
      {returnableItems.length === 0 ? (
        <Alert
          message="Todos los ítems de esta venta ya fueron devueltos."
          type="warning"
          showIcon
        />
      ) : (
        <>
          <Table
            dataSource={returnableItems}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
          />

          <Divider style={{ margin: "12px 0" }} />

          <Space direction="vertical" style={{ width: "100%" }}>
            <Input.TextArea
              placeholder="Motivo de la devolución (opcional)"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
            />

            {totalRefund > 0 && (
              <div style={{ textAlign: "right" }}>
                <Text type="secondary">Total a reembolsar: </Text>
                <Text strong style={{ fontSize: 16 }}>
                  {formatCurrency(totalRefund)}
                </Text>
              </div>
            )}
          </Space>
        </>
      )}
    </Modal>
  );
}