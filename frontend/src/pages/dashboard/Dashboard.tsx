import { Card, Col, Row, Statistic, Table, Tabs, Badge, Alert } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import { useDashboard } from "../../hooks/useDashboard";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import SimpleTable from "../../components/tables/SimpleTable";

export default function Dashboard() {
  const { data, status, isPending, hasWarehouse } = useDashboard();
  const sizes = useResponsiveSizes();

  if (!hasWarehouse) {
    return (
      <Alert
        type="info"
        message="Seleccione un almacén para visualizar el dashboard."
      />
    );
  }

  if (status === "loading" || status === "idle") {
    return <Card loading />;
  }

  if (status === "error") {
    return (
      <Alert
        type="warning"
        message="No se pudo cargar la información del dashboard."
      />
    );
  }

  const { metrics, lowStock, expiring, topProducts } = data!;

  const lowStockColumns: ColumnsType<any> = [
    {
      title: "Producto",
      render: (_, r) => r.name,
      ellipsis: true,
    },
    {
      title: "Existencias",
      dataIndex: "stock",
      width: 90,
      align: "center",
    },
  ];

  const expiringColumns: ColumnsType<any> = [
    {
      title: "Producto",
      render: (_, r) => r.product.name,
      ellipsis: true,
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      width: 90,
      align: "center",
    },
    {
      title: "Vence",
      dataIndex: "expiresAt",
      width: 120,
      render: (v) => dayjs(v).format("DD/MM/YYYY"),
    },
  ];

  const topColumns: ColumnsType<any> = [
    {
      title: "Producto",
      render: (_, r) => r.name,
      ellipsis: true,
    },
    {
      title: "Cantidad vendida",
      render: (_, r) => r.quantity,
      width: 140,
      align: "center",
    },
  ];

  return (
    <>
      <Row gutter={[24, sizes.gutter]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12} lg={6}>
          <Card loading={isPending}>
            <Statistic title="Ventas hoy" value={metrics.salesToday} />
          </Card>
        </Col>

        <Col xs={24} md={12} lg={6}>
          <Card loading={isPending}>
            <Statistic title="Compras hoy" value={metrics.purchasesToday} />
          </Card>
        </Col>

        <Col xs={24} md={12} lg={6}>
          <Card loading={isPending}>
            <Statistic
              title="Ingresos hoy"
              value={metrics.incomeToday}
              precision={2}
            />
          </Card>
        </Col>

        <Col xs={24} md={12} lg={6}>
          <Card loading={isPending}>
            <Statistic
              title="Balance hoy"
              value={metrics.balanceToday}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, sizes.gutter]}>
        <Col xs={24} lg={16}>
          <Card title="Centro de alertas" loading={isPending}>
            <Tabs
              defaultActiveKey="expiring"
              items={[
                {
                  key: "expiring",
                  label: (
                    <>
                      Por vencer <Badge count={expiring.length} />
                    </>
                  ),
                  children: (
                    <Table
                      rowKey="id"
                      columns={expiringColumns}
                      dataSource={expiring}
                      pagination={false}
                      size={sizes.table}
                      scroll={{ y: 300 }}
                    />
                  ),
                },
                {
                  key: "lowStock",
                  label: (
                    <>
                      Baja existencia <Badge count={lowStock.length} />
                    </>
                  ),
                  children: (
                    <Table
                      rowKey={(r) => r.productId}
                      columns={lowStockColumns}
                      dataSource={lowStock}
                      pagination={false}
                      size={sizes.table}
                      scroll={{ y: 300 }}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Top productos" loading={isPending}>
            <SimpleTable
              columns={topColumns}
              data={topProducts}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}