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

  function buildExportRows(data: Sale[]) {
    return data.filter(isExportable).map((s) => ({
      Numero:           s.saleNumber,
      Fecha:            formatDate(s.createdAt),
      Total:            formatCurrency(s.total),
      Puntos_usados:    s.pointsUsed,
      Puntos_obtenidos: s.pointsEarned,
    }));
  }

  function handleExportExcel() {
    exportToExcel(buildExportRows(sales), "historial_ventas");
  }

  function handleExportPdf() {
    exportToPdf(
      "Historial de Ventas",
      [
        { header: "Numero",           dataKey: "Numero"           },
        { header: "Fecha",            dataKey: "Fecha"            },
        { header: "Total",            dataKey: "Total"            },
        { header: "Puntos_usados",    dataKey: "Puntos_usados"    },
        { header: "Puntos_obtenidos", dataKey: "Puntos_obtenidos" },
      ],
      buildExportRows(sales),
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