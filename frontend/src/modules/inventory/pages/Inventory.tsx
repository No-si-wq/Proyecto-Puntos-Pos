import { Tag, Button, Card, Spin, Dropdown, Typography, Space, type MenuProps } from "antd";
import { ArrowLeftOutlined, MoreOutlined, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";

import SimpleTable from "../../../core/components/table/SimpleTable";
import { useInventory } from "../hooks/useInventory";
import { useResponsiveSizes } from "../../../core/hooks/useResponsiveSizes";
import { exportToPdf } from "../../../core/utils/exportPDF";
import { exportToExcel } from "../../../core/utils/exportExcel";
import type { Lot } from "../types/inventory";
import { useDeviceType } from "../../../core/hooks/useDeviceType";

const { Text } = Typography;

function expiryTag(expiresAt?: string | null) {
  if (!expiresAt) return <Tag>N/A</Tag>;
  const days = dayjs(expiresAt).diff(dayjs(), "day");
  if (days < 0)   return <Tag color="red">Vencido</Tag>;
  if (days <= 60) return <Tag color="orange">Por vencer</Tag>;
  return <Tag color="green">OK</Tag>;
}

export default function InventoryPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const sizes = useResponsiveSizes();
  const { isMobile } = useDeviceType();

  const id = productId ? Number(productId) : undefined;

  const {
    stock,
    lots,
    productName,
    loading,
  } = useInventory(id);

  if (!id) {
    return <Card>ID de producto inválido</Card>;
  }

  const exportRows = useMemo(() => {
    return lots.map((l) => ({
      N_Compra: `#${l.purchase.id}`,
      Cantidad: l.quantity,
      Costo: l.cost,
      Expira: l.expiresAt
        ? dayjs(l.expiresAt).format("DD/MM/YYYY")
        : "-",
      Creado_el: dayjs(l.purchase.createdAt).format(
        "DD/MM/YYYY HH:mm"
      ),
    }));
  }, [lots]);

  function handleExportExcel() {
    exportToExcel(exportRows, "Lote_Compras");
  }

  function handleExportPdf() {
    exportToPdf(
      "Lotes de Compra",
      [
        { header: "N° Compra", dataKey: "N_Compra" },
        { header: "Cantidad", dataKey: "Cantidad" },
        { header: "Costo", dataKey: "Costo" },
        { header: "Expira", dataKey: "Expira" },
        { header: "Creado el", dataKey: "Creado_el" },
      ],
      exportRows,
      "Lote_Compras"
    );
  }

  const exportMenu: MenuProps = {
    items: [
      { key: "excel", label: "Exportar Excel", icon: <FileExcelOutlined />, onClick: handleExportExcel },
      { key: "pdf",   label: "Exportar PDF",   icon: <FilePdfOutlined />,   onClick: handleExportPdf   },
    ],
  };

  const desktopColumns: ColumnsType<Lot> = useMemo(() => [
    { title: "Cantidad",  dataIndex: "quantity" },
    { title: "Costo",     dataIndex: "cost" },
    { title: "Creado el", render: (_, r) => dayjs(r.purchase.createdAt).format("DD/MM/YYYY HH:mm") },
    { title: "Expira",    render: (_, r) => r.expiresAt ? dayjs(r.expiresAt).format("DD/MM/YYYY") : "—" },
    { title: "Estado",    render: (_, r) => expiryTag(r.expiresAt) },
  ], []);

  const mobileColumns: ColumnsType<Lot> = useMemo(() => [
    {
      title: "Lote",
      render: (_, r) => (
        <div>
          <Text strong>Compra #{r.purchase.id}</Text>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            {dayjs(r.purchase.createdAt).format("DD/MM/YYYY HH:mm")}
          </div>
        </div>
      ),
    },
    {
      title: "Detalle",
      align: "right",
      render: (_, r) => (
        <div style={{ textAlign: "right" }}>
          {expiryTag(r.expiresAt)}
          <div style={{ fontSize: 12, marginTop: 4 }}>
            <Text type="secondary">Cant: </Text>
            <Text strong>{r.quantity}</Text>
          </div>
          <div style={{ fontSize: 12 }}>
            <Text type="secondary">Costo: </Text>
            <Text>{r.cost}</Text>
          </div>
          {r.expiresAt && (
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
              Vence: {dayjs(r.expiresAt).format("DD/MM/YYYY")}
            </div>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <Card
      title={`Inventario — ${productName ?? ""}`}
      style={{ padding: sizes.cardPadding }}
      extra={
        isMobile ? (
          <Space size={6}>
            <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => navigate(-1)} />
            <Dropdown menu={exportMenu} trigger={["click"]} placement="bottomRight">
              <Button icon={<MoreOutlined />} size="small" />
            </Dropdown>
          </Space>
        ) : (
          <Space>
            <Button onClick={handleExportExcel} size={sizes.button}>Exportar Excel</Button>
            <Button onClick={handleExportPdf}   size={sizes.button}>Exportar PDF</Button>
            <Button size={sizes.button} onClick={() => navigate(-1)}>Volver</Button>
          </Space>
        )
      }
    >
      <Spin spinning={loading}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            padding: isMobile ? "8px 0" : undefined,
          }}
        >
          <Text>Stock actual:</Text>
          <Text strong style={{ fontSize: isMobile ? 18 : 16 }}>{stock}</Text>
        </div>

        <SimpleTable
          data={lots}
          columns={desktopColumns}
          mobileColumns={mobileColumns}
          loading={loading}
        />
      </Spin>
    </Card>
  );
}