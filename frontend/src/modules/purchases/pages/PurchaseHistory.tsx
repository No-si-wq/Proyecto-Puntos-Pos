import { useState } from "react";
import { Button, Space, Drawer, Dropdown } from "antd";
import { FilterOutlined, MoreOutlined, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import dayjs from "dayjs";
import PageHeader from "../../../core/components/common/PageHeader";
import PurchasesTable from "../components/PurchasesTable";
import { formatDate, formatCurrency } from "../../../core/utils/formatters";
import { usePurchases } from "../hooks/usePurchases";
import type { Purchase } from "../types/purchase";
import { exportToPdf } from "../../../core/utils/exportPDF";
import { exportToExcel } from "../../../core/utils/exportExcel";
import ResponsiveRangePicker from "../../../core/components/common/ResponsiveRangePicker";
import { useResponsiveSizes } from "../../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import { useNavigate } from "react-router-dom";

export default function PurchaseHistory() {
  const navigate = useNavigate();
  const { purchases, loadingList, reload } = usePurchases();

  const [range, setRange]       = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const sizes      = useResponsiveSizes();
  const { isMobile } = useDeviceType();

  function handleViewPurchase(purchase: Purchase) {
    navigate(`/purchases/${purchase.id}`);
  }

  function buildExportRows(data: Purchase[]) {
    return data.map((p) => ({
      Fecha:     formatDate(p.createdAt),
      Proveedor: p.supplier.name,
      Total:     formatCurrency(p.total),
      Items:     p.itemsCount ?? 0,
    }));
  }

  function handleExportExcel() {
    exportToExcel(buildExportRows(purchases), "historial_compras");
  }

  function handleExportPdf() {
    exportToPdf(
      "Historial de Compras",
      [
        { header: "Fecha",     dataKey: "Fecha"     },
        { header: "Proveedor", dataKey: "Proveedor" },
        { header: "Total",     dataKey: "Total"     },
        { header: "Items",     dataKey: "Items"     },
      ],
      buildExportRows(purchases),
      "historial_compras"
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
        title="Historial de compras"
        subtitle="Compras registradas"
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
        title="Filtrar compras"
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
            Limpiar
          </Button>
        </Space>
      </Drawer>

      <PurchasesTable
        data={purchases}
        loading={loadingList}
        onView={handleViewPurchase}
      />
    </>
  );
}