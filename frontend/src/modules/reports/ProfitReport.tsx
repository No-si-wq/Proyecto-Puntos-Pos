import { useMemo, useState, useEffect } from "react";
import {
  Table,
  Card,
  Button,
  Statistic,
  Row,
  Col,
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
  const [summary, setSummary]   = useState<any>(null);
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
    setSummary(null);
  }, [warehouseId])

  function clearFilter() {
    setData([]);
    setSummary(null);
    setRange(null);
    if (isMobile) setFilterOpen(false)
  }

  const totalMarginColor = useMemo(() => {
    if (!summary) return "default";
    if (summary.margin >= 30) return "green";
    if (summary.margin >= 15) return "gold";
    return "red";
  }, [summary]);

  const marginLabel = (margin: number) =>
    margin >= 30 ? "Margen Alto" : margin >= 15 ? "Margen Medio" : "Margen Bajo";

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
              disabled={!summary}
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
            type="primary"
            block
            size={sizes.button}
            onClick={clearFilter}
            disabled={!range}
          >
            Limpiar
          </Button>
        </Space>
      </Drawer>

      {summary && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[12, 12]}>
            <Col xs={12} md={6}>
              <Statistic
                title="Ventas Totales"
                value={formatCurrency(summary.totalSales)}
                valueStyle={{ fontSize: isMobile ? 14 : undefined }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Costo Total"
                value={formatCurrency(summary.totalCogs)}
                valueStyle={{ fontSize: isMobile ? 14 : undefined }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Utilidad Bruta"
                value={formatCurrency(summary.totalProfit)}
                valueStyle={{
                  color: summary.totalProfit >= 0 ? "#3f8600" : "#cf1322",
                  fontSize: isMobile ? 14 : undefined,
                }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Margen %"
                value={Number(summary.margin ?? 0).toFixed(2)}
                suffix="%"
                valueStyle={{ fontSize: isMobile ? 14 : undefined }}
              />
              <Tag color={totalMarginColor} style={{ marginTop: 4 }}>
                {marginLabel(summary.margin)}
              </Tag>
            </Col>
          </Row>
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