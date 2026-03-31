import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Space,
  message,
  Tag,
  Alert,
  Descriptions,
  Divider,
  Typography,
  Dropdown,
} from "antd";
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  FilePdfOutlined,
  CloseCircleOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { ConfirmModal } from "../../../core/components/common/ConfirmModal";
import PageHeader from "../../../core/components/common/PageHeader";
import SimpleTable from "../../../core/components/table/SimpleTable";
import { formatCurrency, formatDate } from "../../../core/utils/formatters";
import type { Sale, SaleItems } from "../types/sale";
import type { ColumnsType } from "antd/es/table";
import { exportToPdf } from "../../../core/utils/exportPDF";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import { useSales } from "../hooks/useSales";

const { Text } = Typography;

function SaleItemMobileCard({ item }: { item: SaleItems }) {
  const commissionAmount = item.commissionAmount ?? 0;

  return (
    <Card
      size="small"
      style={{
        borderRadius: 10,
        boxShadow: "0 1px 4px rgba(0,0,0,.08)",
      }}
      styles={{ body: { padding: "10px 14px" } }}
    >
      <Text strong style={{ fontSize: 14 }}>
        {item.product.name}
      </Text>

      <Divider style={{ margin: "8px 0" }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px 12px",
        }}
      >
        <MiniStat label="Cantidad" value={String(item.quantity)} />
        <MiniStat label="Precio" value={formatCurrency(item.price)} />
        <MiniStat label="Descuento" value={formatCurrency(item.discountAmount)} />
        <MiniStat label="Subtotal" value={formatCurrency(item.lineSubtotal)} />
        <MiniStat label="Impuesto" value={formatCurrency(item.taxAmount)} />
        <MiniStat
          label="Total"
          value={formatCurrency(item.lineTotal)}
          highlight
        />
        {commissionAmount > 0 && (
          <MiniStat
            label="Comisión"
            value={formatCurrency(commissionAmount)}
            color="#52c41a"
          />
        )}
      </div>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  highlight,
  color,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div>
      <Text type="secondary" style={{ fontSize: 11 }}>
        {label}
      </Text>
      <br />
      <Text
        strong={highlight}
        style={{ fontSize: 13, color: color ?? "inherit" }}
      >
        {value}
      </Text>
    </div>
  );
}

export default function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();

  const {
    loadingDetail,
    canceling,
    getSaleById,
    cancel,
  } = useSales();

  const [sale, setSale] = useState<Sale | null>(null)
  const loading = loadingDetail;

  async function load() {
    if (!id) return;
    const data = await getSaleById(id);
    setSale(data);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleCancel() {
    if (!sale) return;
    ConfirmModal({
      title: "Cancelar venta",
      content: `¿Cancelar ${sale.saleNumber}?`,
      danger: true,
      onConfirm: async () => {
        await cancel(sale.id);
        message.success("Venta cancelada");
      },
    });
  }

  function handleExportPdf() {
    if (!sale) return;
    const rows = sale.items.map((i) => ({
      Producto: i.product.name,
      Cantidad: i.quantity,
      Precio: i.price,
      Subtotal: i.lineSubtotal,
    }));
    exportToPdf(
      `Venta ${sale.saleNumber}`,
      [
        { header: "Producto", dataKey: "Producto" },
        { header: "Cantidad", dataKey: "Cantidad" },
        { header: "Precio", dataKey: "Precio" },
        { header: "Subtotal", dataKey: "Subtotal" },
      ],
      rows,
      `venta_${sale.saleNumber}`
    );
  }

  function handlePrint() {
    window.print();
  }

  const isCancelled = sale?.status === "CANCELLED";

  const moreMenuItems = [
    {
      key: "print",
      label: "Imprimir",
      icon: <PrinterOutlined />,
      onClick: handlePrint,
    },
    {
      key: "pdf",
      label: "Exportar PDF",
      icon: <FilePdfOutlined />,
      onClick: handleExportPdf,
    },
    ...(!isCancelled
      ? [
          {
            key: "cancel",
            label: "Cancelar venta",
            icon: <CloseCircleOutlined />,
            danger: true,
            onClick: handleCancel,
          },
        ]
      : []),
  ];

  const headerExtra = isMobile ? (
    <Space size={8}>
      <Tag color={isCancelled ? "red" : "green"}>
        {isCancelled ? "Cancelada" : "Completada"}
      </Tag>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
      <Dropdown menu={{ items: moreMenuItems }} trigger={["click"]} placement="bottomRight">
        <Button icon={<MoreOutlined />} />
      </Dropdown>
    </Space>
  ) : (
    <Space wrap>
      <Tag color={isCancelled ? "red" : "green"}>
        {isCancelled ? "Cancelada" : "Completada"}
      </Tag>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
        Volver
      </Button>
      <Button icon={<PrinterOutlined />} onClick={handlePrint}>
        Imprimir
      </Button>
      <Button icon={<FilePdfOutlined />} onClick={handleExportPdf}>
        PDF
      </Button>
      {!isCancelled && (
        <Button
          danger
          icon={<CloseCircleOutlined />}
          onClick={handleCancel}
          loading={canceling}
        >
          Cancelar venta
        </Button>
      )}
    </Space>
  );

  const columns: ColumnsType<SaleItems> = [
    { title: "Producto", dataIndex: ["product", "name"] },
    { title: "Cant.", dataIndex: "quantity" },
    {
      title: "Precio",
      dataIndex: "price",
      render: (v: number) => formatCurrency(v),
    },
    {
      title: "Descuento",
      dataIndex: "discountAmount",
      render: (v: number) => formatCurrency(v),
    },
    {
      title: "Subtotal",
      dataIndex: "lineSubtotal",
      render: (v: number) => formatCurrency(v),
    },
    {
      title: "Impuesto",
      dataIndex: "taxAmount",
      render: (v: number) => formatCurrency(v),
    },
    {
      title: "Total",
      dataIndex: "lineTotal",
      render: (v: number) => formatCurrency(v),
    },
    {
      title: "Comisión",
      dataIndex: "commissionAmount",
      render: (v?: number) =>
        (v ?? 0) > 0 ? (
          <span style={{ color: "#52c41a" }}>{formatCurrency(v ?? 0)}</span>
        ) : (
          <span>—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title={`Venta ${sale?.saleNumber ?? ""}`}
        subtitle="Detalle de factura"
        extra={headerExtra}
      />

      {isCancelled && (
        <Alert
          message="Esta factura fue cancelada"
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
        />
      )}

      <div id="print-area">
        <Card loading={loading} style={{ marginBottom: 16 }}>
          <Descriptions
            column={{ xs: 1, sm: 2 }}
            size="small"
            labelStyle={{ fontWeight: 600, whiteSpace: "nowrap" }}
          >
            <Descriptions.Item label="Fecha">
              {sale && formatDate(sale.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Cliente">
              {sale?.customer?.name ?? "Consumidor final"}
            </Descriptions.Item>
            <Descriptions.Item label="Vendedor">
              {sale?.user?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Método de pago">
              {sale?.paymentMethod}
            </Descriptions.Item>
            {sale?.priceList && (
              <Descriptions.Item label="Lista de precios">
                {sale.priceList.name}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <SimpleTable<SaleItems>
            columns={columns}
            data={sale?.items ?? []}
            loading={loading}
            mobileRowRender={(item) => <SaleItemMobileCard item={item} />}
          />
        </Card>

        <Card>
          <Descriptions
            column={1}
            size="small"
            labelStyle={{ fontWeight: 600 }}
            contentStyle={{ textAlign: "right", justifyContent: "flex-end" }}
          >
            <Descriptions.Item label="Subtotal">
              {formatCurrency(sale?.subtotal ?? 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Descuento">
              {formatCurrency(sale?.discount ?? 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Impuestos">
              {formatCurrency(sale?.taxTotal ?? 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Total">
              <Text strong style={{ fontSize: 16 }}>
                {formatCurrency(sale?.total ?? 0)}
              </Text>
            </Descriptions.Item>
            {(sale?.totalCommission ?? 0) > 0 && (
              <Descriptions.Item label="Comisión total">
                <Text style={{ color: "#52c41a" }}>
                  {formatCurrency(sale?.totalCommission ?? 0)}
                </Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </div>
    </>
  );
}