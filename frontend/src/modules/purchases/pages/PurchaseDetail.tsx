import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Button,
  Space,
  Descriptions,
  Typography,
  Divider,
  Dropdown,
} from "antd";
import type { MenuProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ArrowLeftOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import PageHeader from "../../../core/components/common/PageHeader";
import SimpleTable from "../../../core/components/table/SimpleTable";
import { formatDate, formatCurrency } from "../../../core/utils/formatters";
import type { Purchase, PurchaseItems } from "../types/purchase";
import { exportToPdf } from "../../../core/utils/exportPDF";
import { usePurchases } from "../hooks/usePurchases";
import { useDeviceType } from "../../../core/hooks/useDeviceType";

const { Text } = Typography;

function PurchaseItemMobileCard({ item }: { item: PurchaseItems }) {
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
        <MiniStat label="Costo" value={formatCurrency(item.cost)} />
        <MiniStat
          label="Subtotal"
          value={formatCurrency(item.quantity * item.cost)}
          highlight
        />
      </div>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <Text type="secondary" style={{ fontSize: 11 }}>
        {label}
      </Text>
      <br />
      <Text strong={highlight} style={{ fontSize: 13 }}>
        {value}
      </Text>
    </div>
  );
}

export default function PurchaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPurchaseById, loadingDetail } = usePurchases();
  const { isMobile } = useDeviceType();

  const [purchase, setPurchase] = useState<Purchase | null>(null);

  function handleExportPdf() {
    if (!purchase) return;
    const rows = purchase.items.map((i) => ({
      Producto: i.product.name,
      Cantidad: i.quantity,
      Precio: i.cost,
      Subtotal: i.quantity * i.cost,
    }));
    exportToPdf(
      `Compra #${purchase.id}`,
      [
        { header: "Producto", dataKey: "Producto" },
        { header: "Cantidad", dataKey: "Cantidad" },
        { header: "Precio", dataKey: "Precio" },
        { header: "Subtotal", dataKey: "Subtotal" },
      ],
      rows,
      `Compra_#${purchase.id}`
    );
  }

  async function load() {
    if (!id) return;
    const data = await getPurchaseById(id);
    setPurchase(data);
  }

  useEffect(() => {
    load();
  }, [id]);

  function handlePrint() {
    window.print();
  }

  const mobileMenuItems: MenuProps["items"] = [
    {
      key: "pdf",
      label: "Exportar PDF",
      icon: <FilePdfOutlined />,
      onClick: handleExportPdf,
    },
    {
      key: "print",
      label: "Imprimir",
      icon: <PrinterOutlined />,
      onClick: handlePrint,
    },
  ];

  const headerExtra = isMobile ? (
    <Space size={6}>
      <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => navigate(-1)} />
      <Dropdown menu={{ items: mobileMenuItems }} trigger={["click"]} placement="bottomRight">
        <Button icon={<MoreOutlined />} size="small" />
      </Dropdown>
    </Space>
  ) : (
    <Space wrap>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
        Volver
      </Button>
      <Button icon={<FilePdfOutlined />} onClick={handleExportPdf}>
        PDF
      </Button>
      <Button icon={<PrinterOutlined />} onClick={handlePrint}>
        Imprimir
      </Button>
    </Space>
  );

  const columns: ColumnsType<PurchaseItems> = [
    { title: "Lote", dataIndex: "lotNumber" },
    { title: "Producto", dataIndex: ["product", "name"] },
    { title: "Cantidad", dataIndex: "quantity" },
    {
      title: "Costo",
      dataIndex: "cost",
      render: (v: number) => formatCurrency(v),
    },
    {
      title: "Subtotal",
      render: (_, r) => formatCurrency(r.quantity * r.cost),
    },
  ];

  return (
    <>
      <PageHeader
        title={`Compra #${purchase?.id ?? ""}`}
        subtitle="Detalle de compra"
        extra={headerExtra}
      />

      <div id="print-area">
        <Card loading={loadingDetail} style={{ marginBottom: 16 }}>
          <Descriptions
            column={{ xs: 1, sm: 2 }}
            size="small"
            labelStyle={{ fontWeight: 600, whiteSpace: "nowrap" }}
          >
            <Descriptions.Item label="Proveedor">
              {purchase?.supplier?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Fecha">
              {purchase && formatDate(purchase.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Usuario">
              {purchase?.user?.name ?? "—"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <SimpleTable<PurchaseItems>
            columns={columns}
            data={purchase?.items ?? []}
            loading={loadingDetail}
            mobileRowRender={(item) => <PurchaseItemMobileCard item={item} />}
          />
        </Card>

        <Card>
          <Descriptions
            column={1}
            size="small"
            labelStyle={{ fontWeight: 600 }}
            contentStyle={{ textAlign: "right", justifyContent: "flex-end" }}
          >
            <Descriptions.Item label="Total">
              <Text strong style={{ fontSize: 16 }}>
                {formatCurrency(purchase?.total ?? 0)}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </>
  );
}