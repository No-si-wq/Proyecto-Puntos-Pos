import { Button, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Sale } from "../sale";
import { formatCurrency, formatDate } from "../../../core/utils/formatters";
import SimpleTable from "../../../core/components/table/SimpleTable";

interface Props {
  data: Sale[];
  loading?: boolean,
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
      render: (_, r) => (
        <>
          {r.pointsEarned > 0 && (
            <span style={{ color: "green" }}>
              +{r.pointsEarned}
            </span>
          )}
          {r.pointsUsed > 0 && (
            <span style={{ color: "red", marginLeft: 6 }}>
              −{r.pointsUsed}
            </span>
          )}
        </>
      ),
    },
    {
      title: "Estado",
      dataIndex: "status",
      render: (status: Sale["status"]) => {
        if (status === "CANCELLED") {
          return <Tag color="red">Cancelada</Tag>;
        }

        return <Tag color="green">Completada</Tag>;
      },
    },
    {
      title: "Acciones",
      render: (_: any, r: Sale) => {
        return (
          <>
            {onView && (
              <Button onClick={() => onView(r)}>
                Ver
              </Button>
            )}
          </>
        );
      },
    },
  ];

  return (
    <SimpleTable
      data={data}
      loading={loading}
      columns={columns}
    />
  );
}