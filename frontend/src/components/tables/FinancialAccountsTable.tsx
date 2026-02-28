import { Table, Tag, Button, Card } from "antd";
import { formatCurrency } from "../../utils/formatters";
import { useDeviceType } from "../../hooks/useDeviceType";

type AccountType = "receivable" | "payable";

interface Props {
  data: any[];
  loading?: boolean;
  type: AccountType;
  onPay: (record: any) => void;
}

export default function FinancialAccountsTable({
  data,
  loading,
  type,
  onPay,
}: Props) {
  const { isMobile } = useDeviceType();
  const isReceivable = type === "receivable";

  const isOverdue = (record: any) =>
    record.status !== "PAID" &&
    record.dueDate &&
    new Date(record.dueDate) < new Date();

  /* ================= MOBILE VIEW ================= */
  if (isMobile) {
    return (
      <div 
        style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 12,
            paddingBottom: "calc(100px + env(safe-area-inset-bottom))",
          }}
        >
        {data.map((r) => {
          const percent =
            (Number(r.paidAmount) /
              Number(r.total)) *
            100;

          return (
            <Card
              key={r.id}
              loading={loading}
              size="small"
              style={{ borderRadius: 10 }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {isReceivable
                    ? r.customer?.name
                    : r.supplier?.name}
                </div>

                {r.status === "PAID" ? (
                  <Tag color="green">PAGADA</Tag>
                ) : isOverdue(r) ? (
                  <Tag color="red">VENCIDA</Tag>
                ) : Number(r.paidAmount) > 0 ? (
                  <Tag color="blue">PARCIAL</Tag>
                ) : (
                  <Tag color="orange">PENDIENTE</Tag>
                )}
              </div>

              {/* Totales */}
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "#888",
                  }}
                >
                  Total
                </div>
                <div style={{ fontWeight: 600 }}>
                  {formatCurrency(r.total)}
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "#888",
                  }}
                >
                  Saldo
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {formatCurrency(r.balance)}
                </div>

                {/* Progress */}
                <div
                  style={{
                    height: 6,
                    background: "#f0f0f0",
                    borderRadius: 4,
                    marginTop: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${percent}%`,
                      height: "100%",
                      background: "#52c41a",
                      transition:
                        "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              {/* Vencimiento */}
              {r.dueDate && (
                <div
                  style={{
                    fontSize: 12,
                    marginBottom: 10,
                    color: isOverdue(r)
                      ? "#cf1322"
                      : "#666",
                  }}
                >
                  Vence:{" "}
                  {new Date(
                    r.dueDate
                  ).toLocaleDateString()}
                </div>
              )}

              {/* Acción */}
              {r.status !== "PAID" && (
                <Button
                  type="primary"
                  block
                  size="small"
                  onClick={() => onPay(r)}
                >
                  Registrar Pago
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    );
  }

  /* ================= DESKTOP TABLE ================= */

  const columns = [
    {
      title: isReceivable
        ? "Cliente"
        : "Proveedor",
      render: (_: any, r: any) =>
        isReceivable
          ? r.customer?.name
          : r.supplier?.name,
    },
    {
      title: "Total",
      align: "right" as const,
      render: (_: any, r: any) =>
        formatCurrency(r.total),
    },
    {
      title: "Saldo",
      align: "right" as const,
      render: (_: any, r: any) =>
        formatCurrency(r.balance),
    },
    {
      title: "Estado",
      align: "center" as const,
      render: (_: any, r: any) => {
        if (r.status === "PAID")
          return (
            <Tag color="green">
              PAGADA
            </Tag>
          );

        if (isOverdue(r))
          return (
            <Tag color="red">
              VENCIDA
            </Tag>
          );

        if (Number(r.paidAmount) > 0)
          return (
            <Tag color="blue">
              PARCIAL
            </Tag>
          );

        return (
          <Tag color="orange">
            PENDIENTE
          </Tag>
        );
      },
    },
    {
      title: "",
      align: "center" as const,
      render: (_: any, r: any) =>
        r.status !== "PAID" && (
          <Button
            type="primary"
            size="small"
            onClick={() =>
              onPay(r)
            }
          >
            Pagar
          </Button>
        ),
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={data}
      columns={columns}
      pagination={{ pageSize: 10 }}
    />
  );
}