import { useState } from "react";
import { Button, Space } from "antd";
import dayjs from "dayjs";
import PageHeader from "../../core/components/common/PageHeader";
import PurchasesTable from "./components/PurchasesTable";
import { formatDate, formatCurrency } from "../../core/utils/formatters";
import { usePurchases } from "./usePurchases";
import type { Purchase } from "./purchase";
import { exportToPdf } from "../../core/utils/exportPDF";
import { exportToExcel } from "../../core/utils/exportExcel";
import ResponsiveRangePicker from "../../core/components/common/ResponsiveRangePicker";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../core/hooks/useDeviceType";
import { useNavigate } from "react-router-dom";

export default function PurchaseHistory() {
  const navigate = useNavigate();
  const { purchases, loadingList, reload } = usePurchases();

  const [range, setRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >(null);
  const sizes = useResponsiveSizes();
  const { isMobile } = useDeviceType()

  function handleViewPurchase(purchase: Purchase) {
    navigate(`/purchases/${purchase.id}`);
  }

  function buildExportRows(data: Purchase[]) {
    return data.map((p) => ({
      Fecha: formatDate(p.createdAt),
      Proveedor: p.supplier.name,
      Total: formatCurrency(p.total),
      Items: p.itemsCount ?? 0,
    }));
  }

  function handleExportExcel() {
    exportToExcel(
      buildExportRows(purchases),
      "historial_compras"
    );
  }

  function handleExportPdf() {
    exportToPdf(
      "Historial de Compras",
      [
        { header: "Fecha", dataKey: "Fecha" },
        { header: "Proveedor", dataKey: "Proveedor" },
        { header: "Total", dataKey: "Total" },
        { header: "Items", dataKey: "Items" },
      ],
      buildExportRows(purchases),
      "historial_compras"
    );
  }

  function applyFilter() {
    if (!range || !range[0] || !range[1]) {
      reload();
      return;
    }

    const [start, end] = range;

    reload({
      from: start.startOf("day").toISOString(),
      to: end.endOf("day").toISOString(),
    });
  }

  function clearFilter() {
    setRange(null);
    reload();
  }

  return (
    <>
      <PageHeader
        title="Historial de compras"
        subtitle="Compras registradas"
      />
      <Space
        direction={isMobile ? "vertical" : "horizontal"}
        style={{ marginBottom: 12, width: isMobile ? "100%" : undefined }}
      >
        <ResponsiveRangePicker
          value={range}
          onChange={(v) => setRange(v as any)} 
          size={sizes.input}
        />
        <Button
          type="primary"
          block={isMobile}
          size={sizes.button}
          onClick={applyFilter}
        >
          Aplicar
        </Button>

        <Button
          block={isMobile}
          size={sizes.button}
          onClick={clearFilter}
        >
          Limpiar
        </Button>

        <Button
          block={isMobile}
          size={sizes.button}
          onClick={handleExportExcel}
        >
          Excel
        </Button>

        <Button
          block={isMobile}
          size={sizes.button}
          onClick={handleExportPdf}
        >
          PDF
        </Button>
      </Space>

      <PurchasesTable
        data={purchases}
        loading={loadingList}
        onView={handleViewPurchase}
      />
    </>
  );
}