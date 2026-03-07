import { Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Purchase } from "../purchase";
import { formatCurrency, formatDate } from "../../../core/utils/formatters";
import SimpleTable from "../../../core/components/table/SimpleTable";

interface Props {
  data: Purchase[];
  loading?: boolean,
  onView?: (purchase: Purchase) => void;
}

export default function PurchasesTable({ data, loading, onView }: Props) {
  const columns: ColumnsType<Purchase> = [
    {
      title: "Compra",
      render: (_, r) => `#${r.id}`,
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
      render: (_: any, r: Purchase) => {
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
      columns={columns}
      loading={loading}
    />
  );
}