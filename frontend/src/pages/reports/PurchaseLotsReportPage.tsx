import { useEffect, useState } from "react";
import { message, Button, Input, Space, Row, Col } from "antd";
import { getPurchaseLotsReport } from "../../api/report.api";
import PurchaseLotsReport from "../../components/reports/PurchaseLotsReport";
import PageHeader from "../../components/common/PageHeader";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import { exportToExcel } from "../../utils/exportExcel";
import type { PurchaseLotReportItem } from "../../types/report";
import { exportToPdf } from "../../utils/exportPDF";
import { useRequiredWarehouse } from "../../hooks/useRequiredWarehouse";
import { useDeviceType } from "../../hooks/useDeviceType";

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

  const [data, setData] = useState<PurchaseLotReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState("");
  const { isMobile } = useDeviceType();
  const sizes = useResponsiveSizes();
  const warehouseId = useRequiredWarehouse();

  async function load(filters?: { product?: string }) {
    try {
      if (!warehouseId) return;

      const result = await getPurchaseLotsReport(filters);
      setData(result);
    } catch {
      message.error("Error cargando reporte");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [warehouseId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
    }, 150);

    load({ product: product || undefined })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

  }, [product]);

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
        gutter={[16, 16]}
      >
        <Input
          placeholder="Buscar producto..."
          allowClear
          size={sizes.input}
          value={product}
          onChange={(e) =>
            setProduct(e.target.value)
          }
        />
        <Col>
          <Row gutter={[16, sizes.gutter]}>
            <Col>
              <Button
                size={sizes.button}
                onClick={() => exportExcel(data)}
              >
                Exportar Excel
              </Button>
            </Col>

            <Col>
              <Button
                size={sizes.button}
                onClick={() => exportPdf(data)}
              >
                Exportar PDF
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>

      <Space
        direction={isMobile ? "vertical" : "horizontal"}
        style={{ marginBottom: 12 }}
      >
      </Space>

      <PurchaseLotsReport
        data={data}
        loading={loading}
      />
    </>
  );
}