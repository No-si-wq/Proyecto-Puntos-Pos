import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Button, Table, Space } from "antd";
import type { TableColumnsType } from "antd";
import PageHeader from "../../core/components/common/PageHeader";
import http from "../../core/http/http";
import { formatDate, formatCurrency } from "../../core/utils/formatters";
import type { Purchase, PurchaseItems } from "./purchase";
import { exportToPdf } from "../../core/utils/exportPDF";

export default function PurchaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(false);

  function handleExportPdf() {
    if (!purchase) return;

    const rows = purchase.items.map((i) => ({
      Producto: i.product.name,
      Cantidad: i.quantity,
      Precio: i.cost,
      Subtotal: i.quantity * i.cost,
    }));

    exportToPdf(
      `Compra #${purchase?.id}`,
      [
        { header: "Producto", dataKey: "Producto" },
        { header: "Cantidad", dataKey: "Cantidad" },
        { header: "Precio", dataKey: "Precio" },
        { header: "Subtotal", dataKey: "Subtotal" }
      ],
      rows,
      `Compra_#${purchase?.id}`
    );
  }

  async function load() {
    setLoading(true);

    try {
      const { data } = await http.get(`/purchases/${id}`);
      setPurchase(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  function handlePrint() {
    window.print();
  }

  const columns: TableColumnsType<PurchaseItems> = [
    {
    title: "Producto",
    dataIndex: ["product", "name"]
    },
    {
    title: "Cantidad",
    dataIndex: "quantity"
    },
    {
    title: "Costo",
    dataIndex: "cost",
    render: (v: number) => formatCurrency(v)
    },
    {
      title: "Subtotal",
      render: (_value, r) => formatCurrency(r.quantity * r.cost)
    }
  ];

  return (
    <>
      <PageHeader
        title={`Compra #${purchase?.id}`}
        subtitle="Detalle de compra"
        extra={
          <Space>
            <Button onClick={() => navigate(-1)}>
              Volver
            </Button>
            <Button onClick={handleExportPdf}>
              PDF
            </Button>
            <Button onClick={handlePrint}>
              Imprimir
            </Button>
          </Space>
        }
      />

      <div id="print-area">
        <Card loading={loading}>
          <p><b>Proveedor:</b> {purchase?.supplier?.name}</p>
          <p><b>Fecha:</b> {purchase && formatDate(purchase.createdAt)}</p>
          <p><b>Usuario:</b> {purchase?.user?.name}</p>
        </Card>

        <Table
          rowKey="id"
          dataSource={purchase?.items}
          pagination={false}
          columns={columns}
        />

        <Card style={{ marginTop: 16 }}>
          <p><b>Total:</b> {formatCurrency(purchase?.total ?? 0)}</p>
        </Card>
      </div>
    </>
  );
}
