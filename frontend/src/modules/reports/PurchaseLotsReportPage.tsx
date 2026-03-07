import { useEffect, useState, useMemo } from "react";
import { Button, Input, Row, Col, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import PageHeader from "../../core/components/common/PageHeader";
import SimpleTable from "../../core/components/table/SimpleTable";

import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../core/hooks/useDeviceType";

import { exportToExcel } from "../../core/utils/exportExcel";
import { exportToPdf } from "../../core/utils/exportPDF";

import type { PurchaseLotReportItem } from "./report";
import { useReports } from "./useReport";

function exportPdf(data: PurchaseLotReportItem[]) {
  exportToPdf(
    "Reporte de Lotes de Compras",
    [
      { header: "Producto", dataKey: "product" },
      { header: "Proveedor", dataKey: "supplier" },
      { header: "Cantidad", dataKey: "quantity" },
      { header: "Costo", dataKey: "cost" },
      { header: "Vencimiento", dataKey: "expiresAt" },
    ],
    data.map((r) => ({
      product: r.product.name,
      supplier: r.purchase.supplier.name,
      quantity: r.quantity,
      cost: r.cost,
      expiresAt: r.expiresAt ?? "N/A",
    })),
    "reporte_lotes_compras"
  );
}

function exportExcel(data: PurchaseLotReportItem[]) {
  exportToExcel(
    data.map((r) => ({
      Producto: r.product.name,
      SKU: r.product.sku,
      Proveedor: r.purchase.supplier.name,
      Compra: r.purchase.id,
      Cantidad: r.quantity,
      Costo: r.cost,
      Vencimiento: r.expiresAt ?? "N/A",
    })),
    "reporte_lotes_compras"
  );
}

export default function PurchaseLotsReportPage() {
  const [product, setProduct] = useState("");
  const { purchaseLots, loading, fetchPurchaseLots } = useReports();

  const { isMobile } = useDeviceType();
  const sizes = useResponsiveSizes();

  useEffect(() => {
    fetchPurchaseLots();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPurchaseLots({ product: product || undefined });
    }, 300);

    return () => clearTimeout(timeout);
  }, [product]);

  const columns: ColumnsType<PurchaseLotReportItem> = useMemo(
    () => [
      { title: "Producto", render: (_, r) => r.product.name },
      { title: "Codigo", render: (_, r) => r.product.sku },
      { title: "Proveedor", render: (_, r) => r.purchase.supplier.name },
      { title: "Cantidad", dataIndex: "quantity" },
      { title: "Costo", dataIndex: "cost" },
      {
        title: "Compra",
        render: (_, r) => `#${r.purchase.id}`,
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

          const diff = dayjs(r.expiresAt).diff(dayjs(), "day");

          if (diff < 0) return <Tag color="red">Vencido</Tag>;
          if (diff <= 60) return <Tag color="orange">Por vencer</Tag>;
          return <Tag color="green">OK</Tag>;
        },
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Reporte de compras"
        subtitle="Lotes de productos comprados"
      />

      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 16 }}
        gutter={[16, sizes.gutter]}
      >
        <Col flex="auto">
          <Input
            placeholder="Buscar producto..."
            allowClear
            size={sizes.input}
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
        </Col>

        <Col>
          <Row gutter={[16, sizes.gutter]}>
            <Col>
              <Button
                size={sizes.button}
                block={isMobile}
                onClick={() => exportExcel(purchaseLots)}
              >
                Exportar Excel
              </Button>
            </Col>

            <Col>
              <Button
                size={sizes.button}
                block={isMobile}
                onClick={() => exportPdf(purchaseLots)}
              >
                Exportar PDF
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>

      <SimpleTable
        data={purchaseLots}
        columns={columns}
        loading={loading}
      />
    </>
  );
}