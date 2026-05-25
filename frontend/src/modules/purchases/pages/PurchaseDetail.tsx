import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Button,
  Space,
  message,
  Alert,
  Typography,
  Tag,
  Dropdown,
  Divider,
  type MenuProps,
  Descriptions,
} from "antd";
import {
  ArrowLeftOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  CloseCircleOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import PageHeader from "../../../core/components/common/PageHeader";
import { formatDate, formatCurrency } from "../../../core/utils/formatters";
import type { Purchase, PurchaseItems } from "../types/purchase";
import { exportToPdf } from "../../../core/utils/exportPDF";
import { usePurchases } from "../hooks/usePurchases";
import { ConfirmModal } from "../../../core/components/common/ConfirmModal";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import SimpleTable from "../../../core/components/table/SimpleTable";

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
        {item.lotNumber} - {item.product.name}
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
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { getPurchaseById, loadingDetail, cancel } = usePurchases();
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
      `Compra #${purchase.purchaseNumber}`,
      [
        { header: "Producto",  dataKey: "Producto"  },
        { header: "Cantidad",  dataKey: "Cantidad"  },
        { header: "Precio",    dataKey: "Precio"    },
        { header: "Subtotal",  dataKey: "Subtotal"  },
      ],
      rows,
      `Compra_#${purchase.purchaseNumber}`
    );
  }

  async function load() {
    if (!id) return;
    const data = await getPurchaseById(id);
    setPurchase(data);
  }

  useEffect(() => { load(); }, [id]);

  function handlePrint() { window.print(); }

  async function handleCancel() {
    if (!purchase) return;
    ConfirmModal({
      title: "Cancelar compra",
      content: `¿Cancelar #${purchase.purchaseNumber}?`,
      danger: true,
      onConfirm: async () => {
        await cancel(purchase.id);
        message.success("Compra cancelada");
        load();
      },
    });
  }

  const isActive    = purchase?.status === "ACTIVE";
  const isCancelled = purchase?.status === "CANCELLED";

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
    ...(isActive
      ? [
          {
            key: "cancel",
            label: "Cancelar compra",
            icon: <CloseCircleOutlined />,
            danger: true,
            onClick: handleCancel,
          },
        ]
      : []),
  ];

  const headerExtra = isMobile ? (
    <Space size={6}>
      <Tag color={isCancelled ? "red" : "green"}>
        {isCancelled ? "Cancelada" : "Activa"}
      </Tag>
      <Button
        icon={<ArrowLeftOutlined />}
        size="small"
        onClick={() => navigate(-1)}
      />
      <Dropdown
        menu={{ items: mobileMenuItems }}
        trigger={["click"]}
        placement="bottomRight"
      >
        <Button icon={<MoreOutlined />} size="small" />
      </Dropdown>
    </Space>
  ) : (
    <Space wrap>
      <Tag color={isCancelled ? "red" : "green"}>
        {isCancelled ? "Cancelada" : "Activa"}
      </Tag>
      <Button onClick={() => navigate(-1)}>Volver</Button>
      <Button icon={<FilePdfOutlined />} onClick={handleExportPdf}>PDF</Button>
      <Button icon={<PrinterOutlined />} onClick={handlePrint}>Imprimir</Button>
      {isActive && (
        <Button danger onClick={handleCancel}>
          Cancelar Compra
        </Button>
      )}
      {isCancelled && (
        <Alert message="Esta factura fue cancelada" type="error" showIcon />
      )}
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
        title={`Compra #${purchase?.purchaseNumber ?? ""}`}
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
              {purchase?.purchaseNumber}
            </Descriptions.Item>
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