import { Button, Space, Drawer, Dropdown } from "antd";
import { FilterOutlined, MoreOutlined, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useState } from "react";
import PageHeader from "../../../core/components/common/PageHeader";
import dayjs from "dayjs";
import { useSales } from "../hooks/useSales";
import SalesTable from "../components/SalesTable";
import { formatDate, formatCurrency } from "../../../core/utils/formatters";
import type { Sale } from "../types/sale";
import ResponsiveRangePicker from "../../../core/components/common/ResponsiveRangePicker";
import { useResponsiveSizes } from "../../../core/hooks/useResponsiveSizes";
import { exportToPdf } from "../../../core/utils/exportPDF";
import { exportToExcel } from "../../../core/utils/exportExcel";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import { useNavigate } from "react-router-dom";

type ExportRow = {
  Numero: string;
  Fecha: string;
  Subtotal: string;
  Descuento_total: string;
  Impuesto_Total: string;
  Total: string;
  Puntos_obtenidos: number | string;
  Puntos_usados: number | string;
};

export default function SaleHistory() {
  const { sales, loadingList, reload } = useSales();
  const { isMobile }  = useDeviceType();
  const sizes         = useResponsiveSizes();
  const navigate      = useNavigate();

  const [range, setRange]         = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const isExportable = (s: Sale) => s.status === "COMPLETED";

  function handleViewSale(sale: Sale) {
    navigate(`/sales/${sale.id}`);
  }

  function calculateTotals(data: Sale[]) {
    const filtered = data.filter(isExportable);

    const totals = filtered.reduce(
      (acc, s) => {
        const itemDiscount = s.items.reduce(
          (sum, item) => sum + Number(item.discountAmount || 0),
          0
        );

        acc.subtotal += Number(s.grossSubtotal ?? s.subtotal);
        acc.total += Number(s.total);
        acc.pointsEarned += Number(s.pointsEarned);
        acc.pointsUsed += Number(s.pointsUsed);
        acc.discount += Number(s.discount) + itemDiscount;
        acc.taxTotal += Number(s.taxTotal);

        return acc;
      },
      {
        subtotal: 0,
        total: 0,
        pointsEarned: 0,
        pointsUsed: 0,
        discount: 0,
        taxTotal: 0
      }
    );

    return totals;
  }

  function buildExportRows(data: Sale[]): ExportRow[] {
    return data.filter(isExportable).map((s) => {
      const itemDiscount = s.items.reduce(
        (acc, item) => acc + item.discountAmount,
        0
      );

      const totalDiscount = s.discount + itemDiscount;

      return {
        Numero:           s.saleNumber,
        Fecha:            formatDate(s.createdAt),
        Subtotal:         formatCurrency(s.grossSubtotal ?? s.subtotal + itemDiscount),
        Descuento_total:  formatCurrency(totalDiscount),
        Impuesto_Total:   formatCurrency(s.taxTotal),
        Total:            formatCurrency(s.total),
        Puntos_obtenidos: s.pointsEarned,
        Puntos_usados:    s.pointsUsed,
      };
    });
  }

  function handleExportExcel() {
    exportToExcel(buildExportRows(sales), "historial_ventas");
  }

  function handleExportPdf() {
    const rows = buildExportRows(sales);
    const totals = calculateTotals(sales);

    rows.push({
      Numero: "",
      Fecha: "TOTALES",
      Subtotal: formatCurrency(totals.subtotal),
      Descuento_total: formatCurrency(totals.discount),
      Impuesto_Total: formatCurrency(totals.taxTotal),
      Total: formatCurrency(totals.total),
      Puntos_usados: formatCurrency(totals.pointsUsed),
      Puntos_obtenidos: formatCurrency(totals.pointsEarned),
    });

    exportToPdf(
      "Historial de Ventas",
      [
        { header: "Numero",           dataKey: "Numero"           },
        { header: "Fecha",            dataKey: "Fecha"            },
        { header: "Subtotal",         dataKey: "Subtotal"         },
        { header: "Total Descuento",  dataKey: "Descuento_total"  },
        { header: "Total Impuestos",  dataKey: "Impuesto_Total"   },
        { header: "Total",            dataKey: "Total"            },
        { header: "Puntos usados",    dataKey: "Puntos_usados"    },
        { header: "Puntos obtenidos", dataKey: "Puntos_obtenidos" },
      ],
      rows,
      "historial_ventas"
    );
  }

  function applyFilter() {
    if (!range || !range[0] || !range[1]) { reload(); return; }
    reload({
      from: range[0].startOf("day").toISOString(),
      to:   range[1].endOf("day").toISOString(),
    });
    if (isMobile) setFilterOpen(false);
  }

  function clearFilter() {
    setRange(null);
    reload();
    if (isMobile) setFilterOpen(false);
  }

  const exportMenu: MenuProps = {
    items: [
      { key: "excel", label: "Exportar Excel", icon: <FileExcelOutlined />, onClick: handleExportExcel },
      { key: "pdf",   label: "Exportar PDF",   icon: <FilePdfOutlined />,   onClick: handleExportPdf   },
    ],
  };

  return (
    <>
      <PageHeader
        title="Historial de ventas"
        subtitle="Ventas registradas"
        extra={
          isMobile ? (
            <Space size={6}>
              <Button
                icon={<FilterOutlined />}
                size="small"
                type={range ? "primary" : "default"}
                onClick={() => setFilterOpen(true)}
              >
                Filtrar
              </Button>
              <Dropdown menu={exportMenu} trigger={["click"]} placement="bottomRight">
                <Button icon={<MoreOutlined />} size="small" />
              </Dropdown>
            </Space>
          ) : (
            <Space wrap>
              <ResponsiveRangePicker
                value={range}
                onChange={(v) => setRange(v as any)}
                size={sizes.input}
              />
              <Button type="primary" size={sizes.button} onClick={applyFilter}>
                Aplicar
              </Button>
              <Button size={sizes.button} onClick={clearFilter}>
                Limpiar
              </Button>
              <Button size={sizes.button} onClick={handleExportExcel}>
                Excel
              </Button>
              <Button size={sizes.button} onClick={handleExportPdf}>
                PDF
              </Button>
            </Space>
          )
        }
      />

      <Drawer
        open={filterOpen}
        title="Filtrar ventas"
        placement="bottom"
        height="auto"
        onClose={() => setFilterOpen(false)}
        styles={{
          body: { paddingBottom: "max(24px, env(safe-area-inset-bottom))" },
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <ResponsiveRangePicker
            value={range}
            onChange={(v) => setRange(v as any)}
            size={sizes.input}
            style={{ width: "100%" }}
          />
          <Button type="primary" block size={sizes.button} onClick={applyFilter}>
            Aplicar
          </Button>
          <Button block size={sizes.button} onClick={clearFilter}>
            Limpiar filtro
          </Button>
        </Space>
      </Drawer>

      <SalesTable
        data={sales}
        loading={loadingList}
        onView={handleViewSale}
      />
    </>
  );
}
