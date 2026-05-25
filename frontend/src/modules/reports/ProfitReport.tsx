import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Button,
  Tag,
  Space,
  Drawer,
  Typography,
} from "antd";
import { FilterOutlined, FileExcelOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import ResponsiveRangePicker from "../../core/components/common/ResponsiveRangePicker";
import { useReports } from "./useReport";
import { formatCurrency } from "../../core/utils/formatters";
import { exportProfitReportToExcel } from "../../core/utils/exportExcel";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../core/hooks/useDeviceType";
import { useRequiredWarehouse } from "../warehouses/hooks/useRequiredWarehouse";

const { Text } = Typography;

export default function ProfitReport() {
  const { fetchProfit, loading } = useReports();

  const [range, setRange]       = useState<any>();
  const [data, setData]         = useState<any[]>([]);
  const [summary, setSummary]   = useState<any[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const sizes    = useResponsiveSizes();
  const { isMobile } = useDeviceType();
  const warehouseId = useRequiredWarehouse();

  const handleSearch = async () => {
    if (!range) return;
    const result = await fetchProfit({
      from: range[0].toISOString(),
      to: range[1].toISOString(),
    });
    setData(result.details);
    setSummary(result.summary);
    if (isMobile) setFilterOpen(false);
  };

  useEffect(() => {
    setData([]);
    setSummary([]);
  }, [warehouseId])

  function clearFilter() {
    setData([]);
    setSummary([]);
    setRange(null);
  }

  const marginTagColor = (margin: number) =>
    margin >= 30 ? "green" : margin >= 15 ? "gold" : "red";

  const desktopColumns = [
    { title: "Venta",    dataIndex: "saleNumber" },
    {
      title: "Fecha",
      dataIndex: "date",
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    { title: "Cliente",  dataIndex: "customer" },
    { title: "Vendedor", dataIndex: "seller" },
    {
      title: "Total",
      align: "right" as const,
      render: (_: any, r: any) => formatCurrency(r.total),
    },
    {
      title: "Utilidad",
      align: "right" as const,
      render: (_: any, r: any) => (
        <span style={{ color: r.profit >= 0 ? "#3f8600" : "#cf1322", fontWeight: 500 }}>
          {formatCurrency(r.profit)}
        </span>
      ),
    },
    {
      title: "Margen %",
      align: "right" as const,
      render: (_: any, r: any) => {
        const margin = Number(r?.margin ?? 0);
        return <Tag color={marginTagColor(margin)}>{margin.toFixed(2)}%</Tag>;
      },
    },
  ];

  const mobileColumns = [
    {
      title: "Venta",
      render: (_: any, r: any) => (
        <div>
          <Text strong style={{ display: "block" }}>
            {r.saleNumber}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(r.date).format("DD/MM/YYYY HH:mm")}
          </Text>
          <div style={{ marginTop: 2, fontSize: 12 }}>
            {r.customer && <span>{r.customer}</span>}
            {r.customer && r.seller && <span style={{ color: "#ccc" }}> · </span>}
            {r.seller && <Text type="secondary">{r.seller}</Text>}
          </div>
        </div>
      ),
    },
    {
      title: "Resultado",
      align: "right" as const,
      render: (_: any, r: any) => {
        const margin = Number(r?.margin ?? 0);
        return (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 600 }}>{formatCurrency(r.total)}</div>
            <div style={{ fontSize: 12, color: r.profit >= 0 ? "#3f8600" : "#cf1322" }}>
              {formatCurrency(r.profit)}
            </div>
            <Tag color={marginTagColor(margin)} style={{ marginTop: 2, fontSize: 10 }}>
              {margin.toFixed(1)}%
            </Tag>
          </div>
        );
      },
    },
  ];

  return (
    <Card
      title="Reporte de Utilidad"
      bordered={false}
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
            <Button
              icon={<FileExcelOutlined />}
              size="small"
              disabled={!summary.length}
              onClick={() =>
                exportProfitReportToExcel(
                  summary,
                  data,
                  dayjs(range?.[0]).format("YYYYMMDD"),
                  dayjs(range?.[1]).format("YYYYMMDD")
                )
              }
            />
          </Space>
        ) : undefined
      }
    >
      {!isMobile && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap>
            <ResponsiveRangePicker
              value={range}
              onChange={(dates) => setRange(dates)}
              size={sizes.input}
            />
            <Button
              type="primary"
              size={sizes.button}
              onClick={handleSearch}
              disabled={!range}
            >
              Consultar
            </Button>
            <Button
              size={sizes.button}
              onClick={clearFilter}
            >
              Limpiar
            </Button>
            <Button
              disabled={!summary}
              size={sizes.button}
              icon={<FileExcelOutlined />}
              onClick={() =>
                exportProfitReportToExcel(
                  summary,
                  data,
                  dayjs(range?.[0]).format("YYYYMMDD"),
                  dayjs(range?.[1]).format("YYYYMMDD")
                )
              }
            >
              Exportar Excel
            </Button>
          </Space>
        </Card>
      )}

      <Drawer
        open={filterOpen}
        title="Consultar utilidades"
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
            onChange={(dates) => setRange(dates)}
            size={sizes.input}
          />
          <Button
            type="primary"
            block
            size={sizes.button}
            onClick={handleSearch}
            disabled={!range}
          >
            Consultar
          </Button>
          <Button
            size={sizes.button}
            onClick={clearFilter}
          >
            Limpiar
          </Button>
        </Space>
      </Drawer>

      {summary.length > 0 && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Table
            dataSource={summary}
            rowKey="seller"
            pagination={false}
            size="small"
            columns={[
              { title: "Vendedor", dataIndex: "seller" },
              {
                title: "Ventas",
                align: "right",
                render: (_: any, r: any) => formatCurrency(r.totalSales),
              },
              {
                title: "Costo",
                align: "right",
                render: (_: any, r: any) => formatCurrency(r.totalCogs),
              },
              {
                title: "Utilidad",
                align: "right",
                render: (_: any, r: any) => (
                  <span style={{ color: r.totalProfit >= 0 ? "#3f8600" : "#cf1322", fontWeight: 500 }}>
                    {formatCurrency(r.totalProfit)}
                  </span>
                ),
              },
              {
                title: "Margen %",
                align: "right",
                render: (_: any, r: any) => {
                  const margin = Number(r.margin ?? 0);
                  return <Tag color={marginTagColor(margin)}>{margin.toFixed(2)}%</Tag>;
                },
              },
            ]}
            summary={(pageData) => {
              const totalSales  = pageData.reduce((s, r) => s + Number(r.totalSales), 0);
              const totalCogs   = pageData.reduce((s, r) => s + Number(r.totalCogs), 0);
              const totalProfit = pageData.reduce((s, r) => s + Number(r.totalProfit), 0);
              const margin      = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}><strong>Total</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right"><strong>{formatCurrency(totalSales)}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right"><strong>{formatCurrency(totalCogs)}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <strong style={{ color: totalProfit >= 0 ? "#3f8600" : "#cf1322" }}>
                      {formatCurrency(totalProfit)}
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <Tag color={marginTagColor(margin)}>{margin.toFixed(2)}%</Tag>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </Card>
      )}

      <Table
        style={{ marginTop: 16 }}
        loading={loading}
        dataSource={data}
        rowKey="saleNumber"
        pagination={{ pageSize: 20, simple: isMobile }}
        size={isMobile ? "small" : "middle"}
        columns={isMobile ? mobileColumns : desktopColumns}
        scroll={!isMobile ? { x: 900 } : undefined}
        locale={{ emptyText: "Selecciona un rango de fechas para consultar" }}
        summary={
          isMobile
            ? undefined
            : (pageData) => {
                const totalSales  = pageData.reduce((sum, r) => sum + Number(r.total), 0);
                const totalProfit = pageData.reduce((sum, r) => sum + Number(r.profit), 0);
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4}>
                      <strong>Totales Página</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">
                      <strong>{formatCurrency(totalSales)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right">
                      <strong>{formatCurrency(totalProfit)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} />
                  </Table.Summary.Row>
                );
              }
        }
      />
    </Card>
  );
}