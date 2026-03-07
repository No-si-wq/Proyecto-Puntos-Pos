import { useMemo, useState } from "react";
import {
  Table,
  Card,
  Button,
  Statistic,
  Row,
  Col,
  Tag,
  Space,
} from "antd";
import dayjs from "dayjs";
import ResponsiveRangePicker from "../../core/components/common/ResponsiveRangePicker";
import { useReports } from "./useReport";
import { formatCurrency } from "../../core/utils/formatters";
import { exportProfitReportToExcel } from "../../core/utils/exportExcel";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../core/hooks/useDeviceType";

export default function ProfitReport() {
  const { fetchProfit, loading } = useReports();

  const [range, setRange] = useState<any>();
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const sizes = useResponsiveSizes();
  const { isMobile } = useDeviceType();

  const handleSearch = async () => {
    if (!range) return;

    const result = await fetchProfit({
      from: range[0].toISOString(),
      to: range[1].toISOString(),
    });

    setData(result.details);
    setSummary(result.summary);
  };

  const totalMarginColor = useMemo(() => {
    if (!summary) return "default";
    if (summary.margin >= 30) return "green";
    if (summary.margin >= 15) return "gold";
    return "red";
  }, [summary]);

  return (
    <Card title="Reporte de Utilidad" bordered={false}>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          style={{ marginBottom: 12, width: isMobile ? "100%" : undefined }}
        >
          <ResponsiveRangePicker
            style={{ width: "100%" }}
            onChange={(dates) => setRange(dates)}
            size={sizes.input}
          />

          <Button 
            type="primary" 
            size={sizes.button}
            block={isMobile}
            onClick={handleSearch}
          >
            Consultar
          </Button>

          <Button
            disabled={!summary}
            size={sizes.button}
            block={isMobile}
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

      {summary && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={12} md={6}>
              <Statistic
                title="Ventas Totales"
                value={formatCurrency(summary.totalSales)}
              />
            </Col>

            <Col xs={12} md={6}>
              <Statistic
                title="Costo Total"
                value={formatCurrency(summary.totalCogs)}
              />
            </Col>

            <Col xs={12} md={6}>
              <Statistic
                title="Utilidad Bruta"
                value={formatCurrency(summary.totalProfit)}
                valueStyle={{
                  color:
                    summary.totalProfit >= 0 ? "#3f8600" : "#cf1322",
                }}
              />
            </Col>

            <Col xs={12} md={6}>
              <Statistic
                title="Margen %"
                value={Number(summary.margin ?? 0).toFixed(2)}
                suffix="%"
              />
              <Tag color={totalMarginColor} style={{ marginTop: 8 }}>
                {summary.margin >= 30
                  ? "Margen Alto"
                  : summary.margin >= 15
                  ? "Margen Medio"
                  : "Margen Bajo"}
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
        pagination={{ pageSize: 20 }}
        scroll={{ x: 900 }}
        summary={(pageData) => {

          const totalSales = pageData.reduce(
            (sum, row) => sum + Number(row.total),
            0
          );

          const totalProfit = pageData.reduce(
            (sum, row) => sum + Number(row.profit),
            0
          );

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
        }}
        columns={[
          {
            title: "Venta",
            dataIndex: "saleNumber",
          },
          {
            title: "Fecha",
            dataIndex: "date",
            render: (value) =>
              dayjs(value).format("DD/MM/YYYY HH:mm"),
          },
          {
            title: "Cliente",
            dataIndex: "customer",
          },
          {
            title: "Vendedor",
            dataIndex: "seller",
          },
          {
            title: "Total",
            align: "right",
            render: (_, r) => formatCurrency(r.total),
          },
          {
            title: "Utilidad",
            align: "right",
            render: (_, r) => (
              <span
                style={{
                  color: r.profit >= 0 ? "#3f8600" : "#cf1322",
                  fontWeight: 500,
                }}
              >
                {formatCurrency(r.profit)}
              </span>
            ),
          },
          {
            title: "Margen %",
            align: "right",
            render: (_, r) => {
              const margin = Number(r?.margin ?? 0);
              return (
                <Tag
                  color={
                    margin >= 30
                      ? "green"
                      : margin >= 15
                      ? "gold"
                      : "red"
                  }
                >
                  {margin.toFixed(2)}%
                </Tag>
              );
            },
          },
        ]}
      />
    </Card>
  );
}