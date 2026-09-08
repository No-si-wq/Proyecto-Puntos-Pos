import { useState } from "react";
import { Table, Tag, Button, Card, Space } from "antd";
import dayjs from "dayjs";
import { formatCurrency } from "../../../core/utils/formatters";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import type { BankTransaction, BankTransactionKind } from "../types/bank";

interface Props {
  data: BankTransaction[];
  loading?: boolean;
  onReconcile: (ids: number[]) => Promise<void>;
}

const TYPE_LABELS: Record<BankTransactionKind, { label: string; color: string }> = {
  DEPOSIT: { label: "Depósito", color: "green" },
  WITHDRAWAL: { label: "Retiro", color: "red" },
  TRANSFER_IN: { label: "Transferencia entrante", color: "blue" },
  TRANSFER_OUT: { label: "Transferencia saliente", color: "orange" },
};

const isOutflow = (type: BankTransactionKind) =>
  type === "WITHDRAWAL" || type === "TRANSFER_OUT";

export default function BankTransactionsTable({
  data,
  loading,
  onReconcile,
}: Props) {
  const { isMobile } = useDeviceType();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  async function handleReconcileSelected() {
    if (!selectedIds.length) return;
    await onReconcile(selectedIds);
    setSelectedIds([]);
  }

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {selectedIds.length > 0 && (
          <Button type="primary" onClick={handleReconcileSelected}>
            Conciliar {selectedIds.length} movimiento(s)
          </Button>
        )}

        {data.map((t) => {
          const meta = TYPE_LABELS[t.type];

          return (
            <Card
              key={t.id}
              size="small"
              loading={loading}
              style={{ borderRadius: 10 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Tag color={meta.color}>{meta.label}</Tag>
                {t.reconciled ? (
                  <Tag color="green">CONCILIADO</Tag>
                ) : (
                  <Tag>PENDIENTE</Tag>
                )}
              </div>

              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {isOutflow(t.type) ? "-" : "+"}
                {formatCurrency(t.amount)}
              </div>

              {t.description && (
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  {t.description}
                </div>
              )}

              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                {dayjs(t.createdAt).format("DD/MM/YYYY HH:mm")}
              </div>

              {!t.reconciled && (
                <Button
                  size="small"
                  block
                  style={{ marginTop: 8 }}
                  onClick={() => onReconcile([t.id])}
                >
                  Conciliar
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    );
  }

  const columns = [
    {
      title: "Fecha",
      dataIndex: "createdAt",
      render: (value: string) => dayjs(value).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Tipo",
      render: (_: any, r: BankTransaction) => {
        const meta = TYPE_LABELS[r.type];
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Monto",
      align: "right" as const,
      render: (_: any, r: BankTransaction) => (
        <span style={{ color: isOutflow(r.type) ? "#cf1322" : "#389e0d" }}>
          {isOutflow(r.type) ? "-" : "+"}
          {formatCurrency(r.amount)}
        </span>
      ),
    },
    {
      title: "Descripción",
      dataIndex: "description",
      render: (value?: string) => value || "-",
    },
    {
      title: "Estado",
      align: "center" as const,
      render: (_: any, r: BankTransaction) =>
        r.reconciled ? (
          <Tag color="green">CONCILIADO</Tag>
        ) : (
          <Tag>PENDIENTE</Tag>
        ),
    },
    {
      title: "",
      align: "center" as const,
      render: (_: any, r: BankTransaction) =>
        !r.reconciled && (
          <Button size="small" onClick={() => onReconcile([r.id])}>
            Conciliar
          </Button>
        ),
    },
  ];

  return (
    <>
      {selectedIds.length > 0 && (
        <Space style={{ marginBottom: 12 }}>
          <Button type="primary" onClick={handleReconcileSelected}>
            Conciliar {selectedIds.length} movimiento(s)
          </Button>
        </Space>
      )}

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{ pageSize: 10 }}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as number[]),
          getCheckboxProps: (r) => ({ disabled: r.reconciled }),
        }}
      />
    </>
  );
}