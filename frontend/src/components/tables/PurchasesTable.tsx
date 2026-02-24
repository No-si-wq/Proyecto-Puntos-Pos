import type { ColumnsType } from "antd/es/table";
import type { Purchase } from "../../types/purchase";
import { formatCurrency, formatDate } from "../../utils/formatters";
import SimpleTable from "./SimpleTable";

interface Props {
  data: Purchase[];
  loading?: boolean,
}

export default function PurchasesTable({ data, loading }: Props) {
  const columns: ColumnsType<Purchase> = [
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
  ];

  return (
    <SimpleTable
      data={data}
      columns={columns}
      loading={loading}
    />
  );
}