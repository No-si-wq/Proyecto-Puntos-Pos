import { message, Button, Space } from "antd";
import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import dayjs from "dayjs";
import { useSales } from "../../hooks/useSales";
import SalesTable from "../../components/tables/SalesTable";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { formatDate, formatCurrency } from "../../utils/formatters";
import type { Sale } from "../../types/sale";
import ResponsiveRangePicker from "../../components/common/ResponsiveRangePicker";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import { exportToPdf } from "../../utils/exportPDF";
import { exportToExcel } from "../../utils/exportExcel";
import { useDeviceType } from "../../hooks/useDeviceType";

export default function SaleHistory() {
  const { sales, loadingList, cancel, reload } = useSales();
  const { isMobile } = useDeviceType();
  const isExportable = (s: Sale) =>
    s.status === "COMPLETED"
  const [range, setRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >(null);
  const sizes = useResponsiveSizes();

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

  function confirmCancelSale(id: number, saleNumber: string) {
    ConfirmModal({
      title: "Cancelar venta",
      content: `¿Cancelar ${saleNumber}?`,
      danger: true,
      onConfirm: async () => {
        await cancel(id);
        applyFilter();
        message.success("Venta cancelada");
      },
    });
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
        onCancel={(sale) =>
          confirmCancelSale(
            sale.id,
            sale.saleNumber
          )
        }
      />
    </>
  );
}
