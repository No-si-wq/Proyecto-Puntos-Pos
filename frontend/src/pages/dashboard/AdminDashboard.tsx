import { Row, Col, Card, Statistic, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import { useAdminDashboard } from "../../hooks/useAdminDashboard";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import type { AdminDashboardData } from "../../types/dashboard";
import { formatCurrency } from "../../utils/formatters";

const { Title } = Typography;

export default function AdminDashboard() {
  const { data, loading } = useAdminDashboard();
  const sizes = useResponsiveSizes();

  const financial = data?.financial;
  const warehouses = data?.salesByWarehouse ?? [];
  const topProducts = data?.topProducts ?? [];
  const metrics = data?.metrics;

  const warehouseColumns: ColumnsType<
    AdminDashboardData["salesByWarehouse"][0]
  > = [
    {
      title: "Almacén",
      dataIndex: "warehouseName",
    },
    {
      title: "Ventas",
      dataIndex: "revenue",
      render: (v) => `${formatCurrency(Number(v))}`,
    },
    {
      title: "Costo promedio",
      dataIndex: "cogs",
      render: (v) => `${formatCurrency(Number(v))}`,
    },
    {
      title: "Utilidad",
      dataIndex: "profit",
      render: (v) => (
        <span style={{ color: v >= 0 ? "green" : "red" }}>
          {formatCurrency(Number(v))}
        </span>
      ),
    },
    {
      title: "Ventas (#)",
      dataIndex: "salesCount",
    },
  ];

  const productColumns: ColumnsType<
    AdminDashboardData["topProducts"][0]
  > = [
    {
      title: "Producto",
      dataIndex: "name",
    },
    {
      title: "Unidades vendidas",
      dataIndex: "totalSold",
    },
  ];

  const marginColor =
    (financial?.margin ?? 0) >= 0 ? "green" : "red";

  return (
    <>
      <Title level={3}>
        Dashboard Administrativo Global
      </Title>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Ingresos"
              value={financial?.revenue ?? 0}
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              precision={2}
            />
          </Card>
        </Col>

        <Col xs={24} md={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="COGS"
              value={financial?.totalCogs ?? 0}
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              precision={2}
            />
          </Card>
        </Col>

        <Col xs={24} md={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Utilidad Bruta"
              value={financial?.grossProfit ?? 0}
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              precision={2}
              valueStyle={{
                color:
                  (financial?.grossProfit ?? 0) >= 0
                    ? "green"
                    : "red",
              }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Margen"
              value={financial?.margin ?? 0}
              precision={2}
              suffix="%"
              valueStyle={{ color: marginColor }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Valor Inventario"
              value={data?.inventoryValue ?? 0}
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              precision={2}
            />
          </Card>
        </Col>

        <Col xs={24} md={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Ticket Promedio"
              value={metrics?.averageTicket ?? 0}
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              precision={2}
            />
          </Card>
        </Col>

        <Col xs={24} md={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Rotación Inventario"
              value={metrics?.inventoryTurnover ?? 0}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card
            title="Comparativo por Almacén"
            loading={loading}
          >
            <Table
              rowKey="warehouseId"
              columns={warehouseColumns}
              dataSource={warehouses}
              pagination={false}
              size={sizes.table}
              scroll={{ x: "max-content" }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="Top Productos Globales"
            loading={loading}
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
    </>
  );
}