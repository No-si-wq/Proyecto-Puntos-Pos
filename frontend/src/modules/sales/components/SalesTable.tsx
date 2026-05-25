import { Button, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Sale } from "../types/sale";
import { formatCurrency, formatDate } from "../../../core/utils/formatters";
import SimpleTable from "../../../core/components/table/SimpleTable";

const { Text } = Typography;

interface Props {
  data: Sale[];
  loading?: boolean;
  onView?: (sale: Sale) => void;
}

export default function SalesTable({ data, loading, onView }: Props) {
  const columns: ColumnsType<Sale> = [
    { title: "N°", dataIndex: "saleNumber" },
    {
      title: "Fecha",
      dataIndex: "createdAt",
      render: (v) => formatDate(v),
    },
    {
      title: "Total",
      dataIndex: "total",
      render: (v) => formatCurrency(v),
    },
    {
      title: "Puntos",
      render: (_, r) => {
        const isCancelled = r.status === "CANCELLED";
        const noMovement = r.pointsEarned === 0 && r.pointsUsed === 0;

        return (
          <>
            {noMovement && <span style={{ color: "gray" }}>0</span>}

            {r.pointsEarned > 0 && (
              <span style={{ color: isCancelled ? "red" : "green" }}>
                {isCancelled ? "−" : "+"}{r.pointsEarned}
              </span>
            )}

            {r.pointsUsed > 0 && (
              <span style={{ color: isCancelled ? "green" : "red", marginLeft: 6 }}>
                {isCancelled ? "+" : "−"}{r.pointsUsed}
              </span>
            )}
          </>
        );
      },
    },
    {
      title: "Estado",
      dataIndex: "status",
      render: (status: Sale["status"]) =>
        status === "CANCELLED"
          ? <Tag color="red">Cancelada</Tag>
          : <Tag color="green">Completada</Tag>,
    },
    {
      title: "Acciones",
      render: (_: any, r: Sale) =>
        onView ? <Button onClick={() => onView(r)}>Ver</Button> : null,
    },
  ];

  const mobileColumns: ColumnsType<Sale> = [
    {
      title: "Venta",
      render: (_, r) => {
        const isCancelled = r.status === "CANCELLED";
        return (
          <div>
            <Text strong style={{ display: "block" }}>
              {r.saleNumber}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {formatDate(r.createdAt)}
            </Text>
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {isCancelled
                ? <Tag color="red">Cancelada</Tag>
                : <Tag color="green">Completada</Tag>}
              {r.pointsEarned > 0 && (
                <Text style={{ fontSize: 11, color: isCancelled ? "red" : "green" }}>
                  {isCancelled ? "−" : "+"}{r.pointsEarned} pts
                </Text>
              )}
              {r.pointsUsed > 0 && (
                <Text style={{ fontSize: 11, color: isCancelled ? "green" : "red" }}>
                  {isCancelled ? "+" : "−"}{r.pointsUsed} pts
                </Text>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Total",
      align: "right",
      render: (_, r) => (
        <div style={{ textAlign: "right" }}>
          <Text strong style={{ display: "block" }}>
            {formatCurrency(r.total)}
          </Text>
          {onView && (
            <Button size="small" style={{ marginTop: 4 }} onClick={() => onView(r)}>
              Ver
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <SimpleTable
      data={data}
      loading={loading}
      columns={columns}
      mobileColumns={mobileColumns}
    />
  );
}