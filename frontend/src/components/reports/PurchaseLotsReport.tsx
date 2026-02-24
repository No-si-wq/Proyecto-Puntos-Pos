import { Tag } from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { PurchaseLotReportItem } from "../../types/report";
import SimpleTable from "../tables/SimpleTable";

interface Props {
  data: PurchaseLotReportItem[];
  loading?: boolean,
}

export default function PurchaseLotsReport({ data, loading }: Props) {
  const columns: ColumnsType<PurchaseLotReportItem> = [
    { title: "Producto", render: (_, r) => r.product.name },
    { title: "Codigo", render: (_, r) => r.product.sku },
    { title: "Proveedor", render: (_, r) => r.purchase.supplier.name },
    { title: "Cantidad", dataIndex: "quantity" },
    { title: "Costo", dataIndex: "cost" },
    {
      title: "Compra",
      render: (_, r) => `#${r.purchase.id}`
    },
    {
      title: "Vence",
      render: (_, r) =>
        r.expiresAt
          ? dayjs(r.expiresAt).format("DD/MM/YYYY")
          : "—",
    },
    {
      title: "Estado",
      render: (_, r) => {
        if (!r.expiresAt) return <Tag>N/A</Tag>;
        const d = dayjs(r.expiresAt).diff(dayjs(), "day");
        if (d < 0) return <Tag color="red">Vencido</Tag>;
        if (d <= 60) return <Tag color="orange">Por vencer</Tag>;
        return <Tag color="green">OK</Tag>;
      },
    },
  ];

  return (
    <>
    <SimpleTable
      data={data}
      columns={columns}
      loading={loading}
    />
  </>
  );
}