import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Typography,
  Badge,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  ShopOutlined,
  DollarOutlined,
  BarChartOutlined,
  StockOutlined,
  TrophyOutlined,
  SwapOutlined,
} from "@ant-design/icons";

import { useAdminDashboard } from "./useAdminDashboard";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import type { AdminDashboardData } from "./type/dashboard";
import { formatCurrency } from "../../core/utils/formatters";

const { Title, Text } = Typography;

type MetricCardProps = {
  title: string;
  value: number | undefined;
  loading: boolean;
  icon: React.ReactNode;
  accentColor: string;
  formatter?: (v: number | string) => React.ReactNode;
  suffix?: string;
  precision?: number;
  valueColor?: string;
};

function MetricCard({
  title,
  value,
  loading,
  icon,
  accentColor,
  formatter,
  suffix,
  precision = 2,
  valueColor,
}: MetricCardProps) {
  return (
    <Card
      loading={loading}
      styles={{
        body: { padding: "20px 24px" },
      }}
      style={{
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 10,
        height: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            background: `${accentColor}18`,
            borderRadius: 10,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color: accentColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <Statistic
          title={
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
              {title}
            </Text>
          }
          value={value ?? 0}
          formatter={formatter}
          precision={precision}
          suffix={suffix}
          valueStyle={{
            fontSize: 22,
            fontWeight: 700,
            color: valueColor ?? "#1a1a2e",
            lineHeight: 1.2,
          }}
        />
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data, loading } = useAdminDashboard();
  const sizes = useResponsiveSizes();

  const financial = data?.financial;
  const warehouses = data?.salesByWarehouse ?? [];
  const topProducts = data?.topProducts ?? [];
  const metrics = data?.metrics;
  const reorderAlerts = data?.reorderAlerts;

  const isPositive = (v?: number) => (v ?? 0) >= 0;
  const marginColor = isPositive(financial?.margin) ? "#52c41a" : "#ff4d4f";
  const profitColor = isPositive(financial?.grossProfit) ? "#52c41a" : "#ff4d4f";
  const alertCount = reorderAlerts?.count ?? 0;

  const warehouseColumns: ColumnsType<AdminDashboardData["salesByWarehouse"][0]> = [
    {
      title: "Almacén",
      dataIndex: "warehouseName",
      render: (v) => (
        <span style={{ fontWeight: 600 }}>
          <ShopOutlined style={{ marginRight: 6, color: "#1677ff" }} />
          {v}
        </span>
      ),
    },
    {
      title: "Ventas",
      dataIndex: "revenue",
      align: "right",
      render: (v) => formatCurrency(Number(v)),
    },
    {
      title: "COGS",
      dataIndex: "cogs",
      align: "right",
      render: (v) => (
        <Text type="secondary">{formatCurrency(Number(v))}</Text>
      ),
    },
    {
      title: "Utilidad",
      dataIndex: "profit",
      align: "right",
      render: (v) => (
        <span style={{ color: v >= 0 ? "#52c41a" : "#ff4d4f", fontWeight: 600 }}>
          {v >= 0 ? (
            <RiseOutlined style={{ marginRight: 4 }} />
          ) : (
            <FallOutlined style={{ marginRight: 4 }} />
          )}
          {formatCurrency(Number(v))}
        </span>
      ),
    },
    {
      title: "# Ventas",
      dataIndex: "salesCount",
      align: "center",
      render: (v) => (
        <Tag color="blue" style={{ fontWeight: 600 }}>
          {v}
        </Tag>
      ),
    },
  ];

  const productColumns: ColumnsType<AdminDashboardData["topProducts"][0]> = [
    {
      title: "#",
      render: (_, __, index) => (
        <span
          style={{
            fontWeight: 700,
            color: index < 3 ? ["#f5a623", "#9b9b9b", "#c97b3a"][index] : "#8c8c8c",
          }}
        >
          {index + 1}
        </span>
      ),
      width: 40,
    },
    {
      title: "Producto",
      dataIndex: "name",
      render: (v) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: "Unidades",
      dataIndex: "totalSold",
      align: "right",
      render: (v) => (
        <Tag color="geekblue" style={{ fontWeight: 600 }}>
          {v}
        </Tag>
      ),
    },
  ];

  const reorderColumns: ColumnsType<AdminDashboardData["reorderAlerts"]["items"][0]> = [
    {
      title: "SKU",
      dataIndex: "sku",
      width: 100,
      render: (v) => (
        <Text code style={{ fontSize: 12 }}>
          {v}
        </Text>
      ),
    },
    {
      title: "Producto",
      dataIndex: "productName",
      ellipsis: true,
      render: (v) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: "Stock actual",
      dataIndex: "currentStock",
      width: 120,
      align: "center",
      render: (v) => (
        <Tag color="error" style={{ fontWeight: 700, minWidth: 48, textAlign: "center" }}>
          {v}
        </Tag>
      ),
    },
    {
      title: "Punto reorden",
      dataIndex: "reorderPoint",
      width: 130,
      align: "center",
      render: (v) => (
        <Tag color="default" style={{ fontWeight: 600, minWidth: 48, textAlign: "center" }}>
          {v}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ marginBottom: 28 }}>
        <Title
          level={3}
          style={{ margin: 0, fontWeight: 800, color: "#1a1a2e", letterSpacing: -0.5 }}
        >
          Dashboard Administrativo Global
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Resumen financiero y operativo consolidado
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Ingresos Totales"
            value={financial?.revenue}
            loading={loading}
            icon={<DollarOutlined />}
            accentColor="#1677ff"
            formatter={(v) => formatCurrency(Number(v))}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="COGS"
            value={financial?.totalCogs}
            loading={loading}
            icon={<BarChartOutlined />}
            accentColor="#722ed1"
            formatter={(v) => formatCurrency(Number(v))}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Utilidad Bruta"
            value={financial?.grossProfit}
            loading={loading}
            icon={<RiseOutlined />}
            accentColor={profitColor}
            formatter={(v) => formatCurrency(Number(v))}
            valueColor={profitColor}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Margen"
            value={financial?.margin}
            loading={loading}
            icon={<SwapOutlined />}
            accentColor={marginColor}
            suffix="%"
            valueColor={marginColor}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Valor Inventario"
            value={data?.inventoryValue}
            loading={loading}
            icon={<StockOutlined />}
            accentColor="#13c2c2"
            formatter={(v) => formatCurrency(Number(v))}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Ticket Promedio"
            value={metrics?.averageTicket}
            loading={loading}
            icon={<TrophyOutlined />}
            accentColor="#fa8c16"
            formatter={(v) => formatCurrency(Number(v))}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Rotación Inventario"
            value={metrics?.inventoryTurnover}
            loading={loading}
            icon={<SwapOutlined />}
            accentColor="#52c41a"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <span style={{ fontWeight: 700 }}>
                <ShopOutlined style={{ marginRight: 8, color: "#1677ff" }} />
                Comparativo por Almacén
              </span>
            }
            loading={loading}
            style={{ borderRadius: 10 }}
          >
            <Table
              rowKey="warehouseId"
              columns={warehouseColumns}
              dataSource={warehouses}
              pagination={false}
              size={sizes.table}
              scroll={{ x: "max-content" }}
              rowHoverable
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <span style={{ fontWeight: 700 }}>
                <TrophyOutlined style={{ marginRight: 8, color: "#fa8c16" }} />
                Top Productos Globales
              </span>
            }
            loading={loading}
            style={{ borderRadius: 10 }}
          >
            <Table
              rowKey="productId"
              columns={productColumns}
              dataSource={topProducts}
              pagination={false}
              size={sizes.table}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            loading={loading}
            style={{ borderRadius: 10 }}
            styles={{
              header: {
                borderBottom: alertCount > 0 ? "1px solid #fff1f0" : undefined,
                background: alertCount > 0 ? "#fff1f0" : undefined,
                borderRadius: alertCount > 0 ? "10px 10px 0 0" : undefined,
              },
            }}
            title={
              <span style={{ fontWeight: 700 }}>
                <WarningOutlined
                  style={{ color: "#faad14", marginRight: 8 }}
                />
                Alertas de Reorden
                {alertCount > 0 && (
                  <Badge
                    count={alertCount}
                    style={{ backgroundColor: "#ff4d4f", marginLeft: 10 }}
                  />
                )}
              </span>
            }
          >
            {alertCount === 0 && !loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 0",
                  color: "#8c8c8c",
                }}
              >
                <StockOutlined
                  style={{ fontSize: 32, color: "#52c41a", display: "block", marginBottom: 8 }}
                />
                Todos los productos tienen stock suficiente.
              </div>
            ) : (
              <Table
                rowKey="productId"
                columns={reorderColumns}
                dataSource={reorderAlerts?.items ?? []}
                pagination={{ pageSize: 10, hideOnSinglePage: true }}
                size={sizes.table}
                scroll={{ x: "max-content" }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}