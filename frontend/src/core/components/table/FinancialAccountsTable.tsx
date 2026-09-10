import { Table, Tag, Button, Card, Dropdown, type MenuProps } from "antd";
import { PrinterOutlined, DownOutlined } from "@ant-design/icons"
import { formatCurrency } from "../../utils/formatters";
import { useDeviceType } from "../../hooks/useDeviceType";
import dayjs from "dayjs"

type AccountType = "receivable" | "payable";

interface Props {
  data: any[];
  loading?: boolean;
  type: AccountType;
  onPay: (record: any) => void;
  onPrint?: (record: any, templateId?: number) => void;
  printTemplates?: { id: number; name: string; isDefault?: boolean }[];
}

export default function FinancialAccountsTable({
  data,
  loading,
  type,
  onPay,
  onPrint,
  printTemplates,
}: Props) {
  const { isMobile } = useDeviceType();
  const isReceivable = type === "receivable";

  const isOverdue = (record: any) =>
    record.status !== "PAID" &&
    record.dueDate &&
    new Date(record.dueDate) < new Date();

  function buildPrintMenuItems(r: any): MenuProps["items"] {
    if (!printTemplates?.length) return [];
    return [
      { key: "default", label: "Plantilla por defecto", onClick: () => onPrint?.(r) },
      { type: "divider" as const },
      ...printTemplates.map((t) => ({
        key: String(t.id),
        label: (
          <span>
            {t.name}
            {t.isDefault && <Tag color="blue" style={{ marginLeft: 6, fontSize: 10 }}>Default</Tag>}
          </span>
        ),
        onClick: () => onPrint?.(r, t.id),
      })),
    ];
  }

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
              {isReceivable && onPrint && (
                printTemplates?.length ? (
                  <Dropdown menu={{ items: buildPrintMenuItems(r) }} trigger={["click"]} disabled={!r.payments?.length}>
                    <Button block size="small" style={{ marginTop: 6 }} icon={<PrinterOutlined />} disabled={!r.payments?.length}>
                      Imprimir último abono <DownOutlined style={{ fontSize: 10 }} />
                    </Button>
                  </Dropdown>
                ) : (
                  <Button
                    block
                    size="small"
                    style={{ marginTop: 6 }}
                    icon={<PrinterOutlined />}
                    disabled={!r.payments?.length}
                    onClick={() => onPrint(r)}
                  >
                    Imprimir último abono
                  </Button>
                )
              )}
            </Card>
          );
        })}
      </div>
    );
  }

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
      title: "Vence",
      dataIndex: "dueDate",
      render: (value: number) => dayjs(value).format("DD/MM/YYYY"),
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
        (
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {r.status !== "PAID" && (
              <Button type="primary" size="small" onClick={() => onPay(r)}>
                Pagar
              </Button>
            )}
            {isReceivable && onPrint && (
              printTemplates?.length ? (
                <Dropdown menu={{ items: buildPrintMenuItems(r) }} trigger={["click"]} disabled={!r.payments?.length}>
                  <Button size="small" icon={<PrinterOutlined />} disabled={!r.payments?.length} />
                </Dropdown>
              ) : (
                <Button
                  size="small"
                  icon={<PrinterOutlined />}
                  disabled={!r.payments?.length}
                  onClick={() => onPrint(r)}
                />
              )
            )}
          </div>
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