import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Card, Space, message, Tag, Alert, Dropdown, Typography, Divider, Descriptions, type MenuProps } from "antd";
import {
  PrinterOutlined,
  FilePdfOutlined,
  DownOutlined,
  ArrowLeftOutlined,
  MoreOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { ConfirmModal } from "../../../core/components/common/ConfirmModal";
import PageHeader from "../../../core/components/common/PageHeader";
import { formatCurrency, formatDate } from "../../../core/utils/formatters";
import type { Sale, SaleItems } from "../types/sale";
import { exportToPdf } from "../../../core/utils/exportPDF";
import { useReportTemplates } from "../../report-templates/hooks/useReportTemplates";
import { buildSaleHtml } from "../../report-templates/utils/resolveTemplate";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import { useSales } from "../hooks/useSales";
import SimpleTable from "../../../core/components/table/SimpleTable";
import { RollbackOutlined } from "@ant-design/icons";
import ReturnItemsModal from "../components/ReturnItemsModal";
import type { ReturnItemInput } from "../types/sale";
import { getAllowedRoles } from "../../../core/utils/permissions";
import { usePermissions } from "../../../core/hooks/usePermissions";
import ProtectedButton from "../../../core/components/common/ProtectedButton";

const { Text } = Typography;

function SaleItemMobileCard({ item }: { item: SaleItems }) {

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
        <MiniStat
          label="Cantidad"
          value={
            (item.returnedQuantity ?? 0) > 0
              ? `${item.quantity} (-${item.returnedQuantity} dev.)`
              : String(item.quantity)
          }
          color={(item.returnedQuantity ?? 0) > 0 ? "#ff4d4f" : undefined}
        />
        <MiniStat label="Precio" value={formatCurrency(item.price)} />
        <MiniStat label="Descuento" value={formatCurrency(item.discountAmount)} />
        <MiniStat label="Subtotal" value={formatCurrency(item.lineSubtotal)} />
        <MiniStat label="Impuesto" value={formatCurrency(item.taxAmount)} />
        <MiniStat
          label="Total"
          value={formatCurrency(item.lineTotal)}
          highlight
        />
        {item.observations && (
          <div style={{ gridColumn: "1 / -1", marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>OBS.</Text>
            <br />
            <Text style={{ fontSize: 13 }}>{item.observations}</Text>
          </div>
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
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { getSaleById, cancel, canceling, loadingDetail,returnItems, returning } = useSales();
  const { isMobile } = useDeviceType();
  const { canAccess } = usePermissions();

  const [sale, setSale]       = useState<Sale | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const loading = loadingDetail;
  

  const { templates, loadingList, getById: getTemplateById, getDefault } =
    useReportTemplates();

  async function load() {
    if (!id) return;
    const data = await getSaleById(id);
    setSale(data);
  }

  useEffect(() => { load(); }, [id]);

  async function handleCancel() {
    if (!sale) return;
    ConfirmModal({
      title: "Cancelar venta",
      content: `¿Cancelar ${sale.saleNumber}?`,
      danger: true,
      onConfirm: async () => {
        await cancel(sale.id);
        message.success("Venta cancelada");
        setSale((prev) => prev ? { ...prev, status: "CANCELLED" } : prev);
      },
    });
  }

  async function handleReturn(items: ReturnItemInput[], reason: string) {
    if (!sale) return;
    await returnItems(sale.id, { items, reason });
    message.success("Devolución registrada correctamente");
    setReturnModalOpen(false);
    await load();
  }

  async function handlePrint(templateId?: number) {
    if (!sale) return;
    let config;
    try {
      if (templateId) {
        const t = await getTemplateById(templateId);
        config = t.config;
      } else {
        const defaultT = await getDefault();
        if (!defaultT) { window.print(); return; }
        config = defaultT.config;
      }
    } catch {
      message.error("No se pudo cargar la plantilla");
      window.print();
      return;
    }
    const html = buildSaleHtml(sale, config);
    const win = window.open("", "_blank", "width=700,height=900");
    if (!win) { message.error("No se pudo abrir la ventana de impresión"); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.onafterprint = () => win.close();
  }

  async function handleExportPdf(templateId?: number) {
    if (!sale) return;
    let config;
    try {
      if (templateId) {
        const t = await getTemplateById(templateId);
        config = t.config;
      } else {
        const defaultT = await getDefault();
        if (!defaultT) { exportToPdfFallback(); return; }
        config = defaultT.config;
      }
    } catch {
      message.error("No se pudo cargar la plantilla");
      exportToPdfFallback();
      return;
    }
    const html = buildSaleHtml(sale, config);
    const win = window.open("", "_blank", "width=700,height=900");
    if (!win) { message.error("No se pudo abrir la ventana"); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  function exportToPdfFallback() {
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
        { header: "Precio",   dataKey: "Precio"   },
        { header: "Subtotal", dataKey: "Subtotal" },
      ],
      rows,
      `venta_${sale.saleNumber}`
    );
  }

  function buildTemplateMenuItems(action: "print" | "pdf"): MenuProps["items"] {
    if (!templates.length) {
      return [
        {
          key: "fallback",
          label: action === "print" ? "Imprimir vista actual" : "PDF genérico",
          onClick: () =>
            action === "print" ? window.print() : exportToPdfFallback(),
        },
      ];
    }
    return [
      {
        key: "default",
        label: "Plantilla por defecto",
        onClick: () =>
          action === "print" ? handlePrint() : handleExportPdf(),
      },
      { type: "divider" as const },
      ...templates.map((t) => ({
        key: String(t.id),
        label: (
          <span>
            {t.name}
            {t.isDefault && (
              <Tag color="success" style={{ marginLeft: 8, fontSize: 10 }}>
                Default
              </Tag>
            )}
          </span>
        ),
        onClick: () =>
          action === "print" ? handlePrint(t.id) : handleExportPdf(t.id),
      })),
    ];
  }

  const isCompleted = sale?.status === "COMPLETED";
  const isCancelled = sale?.status === "CANCELLED";
  const totalCommission = sale?.items.reduce(
    (sum, item) => sum + Number(item.commissionAmount ?? 0),
    0
  ) ?? 0;

  const mobileMenuItems: MenuProps["items"] = [
    {
      key: "print",
      label: "Imprimir",
      icon: <PrinterOutlined />,
      children: buildTemplateMenuItems("print") ?? [],
    },
    {
      key: "pdf",
      label: "Exportar PDF",
      icon: <FilePdfOutlined />,
      children: buildTemplateMenuItems("pdf") ?? [],
    },
    ...(isCompleted && canAccess(...getAllowedRoles("sales", "devolution"))
      ? [
          {
            key: "return",
            label: "Registrar devolución",
            icon: <RollbackOutlined />,
            onClick: () => setReturnModalOpen(true),
          },
        ]
      : []),
    ...(isCompleted && canAccess(...getAllowedRoles("sales", "cancel"))
      ? [
          { type: "divider" as const },
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
    <Space size={6}>
      <Tag color={isCancelled ? "red" : "green"}>
        {isCancelled ? "Cancelada" : "Completada"}
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
        <Button icon={<MoreOutlined />} size="small" loading={loadingList} />
      </Dropdown>
    </Space>
  ) : (
    <Space wrap>
      <Tag color={isCancelled ? "red" : "green"}>
        {isCancelled ? "Cancelada" : "Completada"}
      </Tag>

      <Button onClick={() => navigate(-1)}>Volver</Button>

      <Dropdown menu={{ items: buildTemplateMenuItems("print") }} trigger={["click"]}>
        <Button icon={<PrinterOutlined />} loading={loadingList}>
          Imprimir <DownOutlined style={{ fontSize: 10 }} />
        </Button>
      </Dropdown>

      <Dropdown menu={{ items: buildTemplateMenuItems("pdf") }} trigger={["click"]}>
        <Button icon={<FilePdfOutlined />} loading={loadingList}>
          PDF <DownOutlined style={{ fontSize: 10 }} />
        </Button>
      </Dropdown>
        {!isCancelled && (
          <>
            <ProtectedButton
              roles={getAllowedRoles("sales", "devolution")}
              icon={<RollbackOutlined />}
              onClick={() => setReturnModalOpen(true)}
              loading={returning}
            >
              Devolución
            </ProtectedButton>
            <ProtectedButton
              roles={getAllowedRoles("sales", "cancel")}
              danger
              icon={<CloseCircleOutlined />}
              onClick={handleCancel}
              loading={canceling}
            >
              Cancelar venta
            </ProtectedButton>
          </>
        )}
    </Space>
  );

  const columns: ColumnsType<SaleItems> = [
    { title: "Producto", dataIndex: ["product", "name"] },
    {
      title: "Obs.",
      dataIndex: "observations",
      render: (v: string | null) =>
        v ? <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> : null,
    },
    {
      title: "Cant.",
      dataIndex: "quantity",
      render: (v: number, record: SaleItems) => {
        const returned = (record.returnedQuantity ?? 0);
        return returned > 0 ? (
          <span>
            {v}{" "}
            <Tag color="red" style={{ fontSize: 10, marginLeft: 4 }}>
              -{returned} dev.
            </Tag>
          </span>
        ) : v;
      },
    },
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
              {sale?.seller?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Método de pago">
              {sale?.paymentMethod}
            </Descriptions.Item>
            {sale?.paymentMethod === "CASH" && sale?.amountPaid != null && (
              <Descriptions.Item label="Monto recibido">
                {formatCurrency(sale.amountPaid)}
              </Descriptions.Item>
            )}
            {sale?.paymentMethod === "CASH" && sale?.changeAmount != null && (
              <Descriptions.Item label="Cambio">
                <Text style={{ color: "#52c41a" }}>
                  {formatCurrency(sale.changeAmount)}
                </Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Observaciones">
              {sale?.observations ?? "-"}
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
            {(sale?.totalRefunded ?? 0) <= 0 && (
              <Descriptions.Item label="Total">
                <Text strong style={{ fontSize: 16 }}>
                  {formatCurrency(sale?.total ?? 0)}
                </Text>
              </Descriptions.Item>
            )}
            {(sale?.totalRefunded ?? 0) > 0 && (
              <>
                <Descriptions.Item label="Total antes devolucion">
                  <Text strong style={{ fontSize: 16, color: "#13c413" }}>
                    {formatCurrency(Number(sale?.total ?? 0) + Number(sale?.totalRefunded ?? 0))}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Devuelto">
                  <Text style={{ color: "#ff4d4f" }}>
                    -{formatCurrency(sale?.totalRefunded ?? 0)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Total">
                  <Text strong style={{ fontSize: 16, color: "#1677ff" }}>
                    {formatCurrency((sale?.total ?? 0))}
                  </Text>
                </Descriptions.Item>
              </>
            )}
            {sale?.paymentMethod === "CASH" && sale?.amountPaid != null && (
              <Descriptions.Item label="Efectivo recibido">
                {formatCurrency(sale.amountPaid)}
              </Descriptions.Item>
            )}
            {sale?.paymentMethod === "CASH" && sale?.changeAmount != null && (
              <Descriptions.Item label="Cambio">
                <Text style={{ color: "#52c41a" }}>
                  {formatCurrency(sale.changeAmount)}
                </Text>
              </Descriptions.Item>
            )}
            {totalCommission > 0 && (
              <Descriptions.Item label="Comisión total">
                <Text style={{ color: "#52c41a" }}>
                  {formatCurrency(totalCommission)}
                </Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </div>

      <ReturnItemsModal
        open={returnModalOpen}
        items={sale?.items ?? []}
        onConfirm={handleReturn}
        onCancel={() => setReturnModalOpen(false)}
        loading={returning}
      />

    </>
  );
}