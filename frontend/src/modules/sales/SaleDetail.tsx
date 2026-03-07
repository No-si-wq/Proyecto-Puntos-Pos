import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Card, Table, Space, message, Tag, Alert } from "antd";
import { ConfirmModal } from "../../core/components/common/ConfirmModal";
import PageHeader from "../../core/components/common/PageHeader";
import http from "../../core/http/http";
import { formatCurrency, formatDate } from "../../core/utils/formatters";
import type { Sale } from "./sale";
import { exportToPdf } from "../../core/utils/exportPDF";

export default function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!sale) return;

    ConfirmModal({
      title: "Cancelar venta",
      content: `¿Cancelar ${sale.saleNumber}?`,
      danger: true,
      onConfirm: async () => {
        await http.post(`/sales/${sale.id}/cancel`);
        message.success("Venta cancelada");
        load();
      }
    });
  }

  function handleExportPdf() {
    if (!sale) return;

    const rows = sale.items.map((i) => ({
      Producto: i.product.name,
      Cantidad: i.quantity,
      Precio: i.price,
      Subtotal: i.lineSubtotal
    }));

    exportToPdf(
      `Venta ${sale.saleNumber}`,
      [
        { header: "Producto", dataKey: "Producto" },
        { header: "Cantidad", dataKey: "Cantidad" },
        { header: "Precio", dataKey: "Precio" },
        { header: "Subtotal", dataKey: "Subtotal" }
      ],
      rows,
      `venta_${sale.saleNumber}`
    );
  }

  async function load() {
    setLoading(true);

    try {
      const { data } = await http.get(`/sales/${id}`);
      setSale(data);
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

  const columns = [
    {
      title: "Producto",
      dataIndex: ["product", "name"]
    },
    {
      title: "Cantidad",
      dataIndex: "quantity"
    },
    {
      title: "Precio",
      dataIndex: "price",
      render: (v: number) => formatCurrency(v)
    },
    {
      title: "Descuento",
      dataIndex: "discountAmount",
      render: (v: number) => formatCurrency(v)
    },
    {
      title: "Subtotal",
      dataIndex: "lineSubtotal",
      render: (v: number) => formatCurrency(v)
    }
  ];

  return (
    <>
    <PageHeader
      title={`Venta ${sale?.saleNumber}`}
      subtitle="Detalle de factura"
      extra={
        <Space>
          <Tag color={sale?.status === "CANCELLED" ? "red" : "green"}>
            {sale?.status === "CANCELLED"
              ? "Cancelada"
              : "Completada"}
          </Tag>
          <Button onClick={() => navigate(-1)}>
            Volver
          </Button>

          <Button onClick={handlePrint}>
            Imprimir
          </Button>

          <Button onClick={handleExportPdf}>
            PDF
          </Button>

          {sale?.status === "COMPLETED" && (
            <Button danger onClick={handleCancel}>
              Cancelar venta
            </Button>
          )}
          {sale?.status === "CANCELLED" && (
            <Alert
              message="Esta factura fue cancelada"
              type="error"
              showIcon
            />
          )}
        </Space>
      }
    />
      <div id="print-area">
        <Card loading={loading}>
          <p><b>Fecha:</b> {sale && formatDate(sale.createdAt)}</p>
          <p><b>Cliente:</b> {sale?.customer?.name || "Consumidor final"}</p>
          <p><b>Vendedor:</b> {sale?.user?.name}</p>
        </Card>

        <Table
          style={{ marginTop: 16 }}
          dataSource={sale?.items}
          columns={columns}
          pagination={false}
          rowKey="id"
        />

        <Card style={{ marginTop: 16 }}>
          <p><b>Subtotal:</b> {formatCurrency(sale?.subtotal ?? 0)}</p>
          <p><b>Descuento:</b> {formatCurrency(sale?.discount ?? 0)}</p>
          <p><b>Total:</b> {formatCurrency(sale?.total ?? 0)}</p>
        </Card>
      </div>
    </>
  );
}