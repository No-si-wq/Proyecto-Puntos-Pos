import { useEffect, useState, useMemo } from "react";
import { Button, Input, Tag, Space, Dropdown, Typography } from "antd";
import { MoreOutlined, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import dayjs from "dayjs";

import PageHeader from "../../core/components/common/PageHeader";
import SimpleTable from "../../core/components/table/SimpleTable";

import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../core/hooks/useDeviceType";

import { exportToExcel } from "../../core/utils/exportExcel";
import { exportToPdf } from "../../core/utils/exportPDF";

import type { PurchaseLotReportItem } from "./report";
import { useReports } from "./useReport";

const { Text } = Typography;

function exportPdf(data: PurchaseLotReportItem[]) {
  exportToPdf(
    "Reporte de Lotes de Compras",
    [
      { header: "Producto",    dataKey: "product"   },
      { header: "Proveedor",   dataKey: "supplier"  },
      { header: "Cantidad",    dataKey: "quantity"  },
      { header: "Costo",       dataKey: "cost"      },
      { header: "Vencimiento", dataKey: "expiresAt" },
    ],
    data.map((r) => ({
      product:   r.product.name,
      supplier:  r.purchase.supplier.name,
      quantity:  r.quantity,
      cost:      r.cost,
      expiresAt: r.expiresAt ?? "N/A",
    })),
    "reporte_lotes_compras"
  );
}

function exportExcel(data: PurchaseLotReportItem[]) {
  exportToExcel(
    data.map((r) => ({
      Producto:    r.product.name,
      SKU:         r.product.sku,
      Proveedor:   r.purchase.supplier.name,
      Lote:        r.lotNumber,
      Cantidad:    r.quantity,
      Costo:       r.cost,
      Vencimiento: r.expiresAt ?? "N/A",
    })),
    "reporte_lotes_compras"
  );
}

function expiryTag(expiresAt: string | null | undefined) {
  if (!expiresAt) return <Tag>N/A</Tag>;
  const diff = dayjs(expiresAt).diff(dayjs(), "day");
  if (diff < 0)   return <Tag color="red">Vencido</Tag>;
  if (diff <= 60) return <Tag color="orange">Por vencer</Tag>;
  return <Tag color="green">OK</Tag>;
}

export default function PurchaseLotsReportPage() {
  const [product, setProduct] = useState("");
  const { purchaseLots, loading, fetchPurchaseLots } = useReports();

  const { isMobile } = useDeviceType();
  const sizes        = useResponsiveSizes();

  useEffect(() => { fetchPurchaseLots(); }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPurchaseLots({ product: product || undefined });
    }, 300);
    return () => clearTimeout(timeout);
  }, [product]);

  // ── Columnas desktop ──────────────────────────────────────────────────────
  const desktopColumns: ColumnsType<PurchaseLotReportItem> = useMemo(
    () => [
      { title: "Lote",  render: (_, r) => r.lotNumber ?? "-"           },
      { title: "Producto",  render: (_, r) => r.product.name           },
      { title: "Codigo",    render: (_, r) => r.product.sku            },
      { title: "Proveedor", render: (_, r) => r.purchase.supplier.name },
      { title: "Cantidad",  dataIndex: "quantity"                       },
      { title: "Costo",     dataIndex: "cost"                           },
      { title: "Compra",    render: (_, r) => `#${r.purchase.purchaseNumber ?? "-"}`      },
      {
        title: "Vence",
        render: (_, r) =>
          r.expiresAt ? dayjs(r.expiresAt).format("DD/MM/YYYY") : "—",
      },
      {
        title: "Estado",
        render: (_, r) => expiryTag(r.expiresAt),
      },
    ],
    []
  );

  // ── Columnas mobile ───────────────────────────────────────────────────────
  const mobileColumns: ColumnsType<PurchaseLotReportItem> = useMemo(
    () => [
      {
        title: "Producto",
        render: (_, r) => (
          <div>
            <Text strong style={{ display: "block" }}>{r.product.name}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {r.product.sku} · {r.purchase.supplier.name}
            </Text>
            <div style={{ marginTop: 4, fontSize: 12 }}>
              Lote <Text code style={{ fontSize: 11 }}>#{r.lotNumber ?? "-"}</Text>
            </div>
          </div>
        ),
      },
      {
        title: "Lote",
        align: "right",
        render: (_, r) => (
          <div style={{ textAlign: "right" }}>
            {expiryTag(r.expiresAt ?? "-")}
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
    ],
    []
  );

  // ── Menú exportar ─────────────────────────────────────────────────────────
  const exportMenu: MenuProps = {
    items: [
      { key: "excel", label: "Exportar Excel", icon: <FileExcelOutlined />, onClick: () => exportExcel(purchaseLots) },
      { key: "pdf",   label: "Exportar PDF",   icon: <FilePdfOutlined />,   onClick: () => exportPdf(purchaseLots)   },
    ],
  };

  return (
    <>
      <PageHeader
        title="Reporte de compras"
        subtitle="Lotes de productos comprados"
        extra={
          isMobile ? (
            <Dropdown menu={exportMenu} trigger={["click"]} placement="bottomRight">
              <Button icon={<MoreOutlined />} size="small" />
            </Dropdown>
          ) : (
            <Space>
              <Button size={sizes.button} icon={<FileExcelOutlined />} onClick={() => exportExcel(purchaseLots)}>
                Exportar Excel
              </Button>
              <Button size={sizes.button} icon={<FilePdfOutlined />} onClick={() => exportPdf(purchaseLots)}>
                Exportar PDF
              </Button>
            </Space>
          )
        }
      />

      {/* Buscador siempre visible, ancho completo */}
      <div style={{ marginBottom: 12 }}>
        <Input
          placeholder="Buscar producto..."
          allowClear
          size={sizes.input}
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      <SimpleTable
        data={purchaseLots}
        columns={desktopColumns}
        mobileColumns={mobileColumns}
        loading={loading}
      />
    </>
  );
}