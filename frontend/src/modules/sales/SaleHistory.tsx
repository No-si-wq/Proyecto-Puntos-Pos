import { Button, Space } from "antd";
import { useState } from "react";
import PageHeader from "../../core/components/common/PageHeader";
import dayjs from "dayjs";
import { useSales } from "./useSales";
import SalesTable from "./components/SalesTable";
import { formatDate, formatCurrency } from "../../core/utils/formatters";
import type { Sale } from "./sale";
import ResponsiveRangePicker from "../../core/components/common/ResponsiveRangePicker";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import { exportToPdf } from "../../core/utils/exportPDF";
import { exportToExcel } from "../../core/utils/exportExcel";
import { useDeviceType } from "../../core/hooks/useDeviceType";
import { useNavigate } from "react-router-dom";

export default function SaleHistory() {
  const { sales, loadingList, reload } = useSales();
  const { isMobile } = useDeviceType();
  const isExportable = (s: Sale) =>
    s.status === "COMPLETED"
  const [range, setRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >(null);
  const sizes = useResponsiveSizes();
  const navigate = useNavigate();

  function handleViewSale(sale: Sale) {
    navigate(`/sales/${sale.id}`);
  }

  function buildExportRows(data: Sale[]) {
    return data
      .filter(isExportable)
      .map((s) => ({
        Numero: s.saleNumber,
        Fecha: formatDate(s.createdAt),
        Total: formatCurrency(s.total),
        Puntos_usados: s.pointsUsed,
        Puntos_obtenidos: s.pointsEarned
      }));
  }

  function handleExportExcel() {
    exportToExcel(
      buildExportRows(sales),
      "historial_ventas"
    );
  }

  function handleExportPdf() {
    exportToPdf(
      "Historial de Ventas",
      [
        { header: "Numero", dataKey: "Numero" },
        { header: "Fecha", dataKey: "Fecha" },
        { header: "Total", dataKey: "Total" },
        { header: "Puntos_usados", dataKey: "Puntos_usados" },
        { header: "Puntos_obtenidos", dataKey: "Puntos_obtenidos" },
      ],
      buildExportRows(sales),
      "historial_ventas"
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
        title="Historial de ventas"
        subtitle="Ventas registradas"
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

      <SalesTable
        data={sales}
        loading={loadingList}
        onView={handleViewSale}
      />
    </>
  );
}