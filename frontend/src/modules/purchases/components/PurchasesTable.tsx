import { Button, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Purchase } from "../types/purchase";
import { formatCurrency, formatDate } from "../../../core/utils/formatters";
import SimpleTable from "../../../core/components/table/SimpleTable";

const { Text } = Typography;

interface Props {
  data: Purchase[];
  loading?: boolean;
  onView?: (purchase: Purchase) => void;
}

export default function PurchasesTable({ data, loading, onView }: Props) {
  const columns: ColumnsType<Purchase> = [
    {
      title: "Compra",
      render: (_, r) => `#${r.id ?? "-"}`,
    },
    {
      title: "Fecha",
      dataIndex: "createdAt",
      render: (v) => formatDate(v),
    },
    {
      title: "Proveedor",
      render: (_, r) => r.supplier.name,
    },
    {
      title: "Total",
      dataIndex: "total",
      render: (v) => formatCurrency(v),
    },
    {
      title: "Ítems",
      align: "center",
      render: (_, r) => r.itemsCount ?? "—",
    },
    {
      title: "Acciones",
      render: (_: any, r: Purchase) =>
        onView ? <Button onClick={() => onView(r)}>Ver</Button> : null,
    },
  ];

  const mobileColumns: ColumnsType<Purchase> = [
    {
      title: "Compra",
      render: (_, r) => (
        <div>
          <Text strong style={{ display: "block" }}>
            {r.supplier.name}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            #{r.id ?? "-"} · {formatDate(r.createdAt)}
          </Text>
          <div style={{ marginTop: 4 }}>
            {r.itemsCount != null && (
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
                {r.itemsCount} ítems
              </Text>
            )}
          </div>
        </div>
      ),
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
            <Button
              size="small"
              style={{ marginTop: 4 }}
              onClick={() => onView(r)}
            >
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
      columns={columns}
      loading={loading}
      mobileColumns={mobileColumns}
    />
  );
}