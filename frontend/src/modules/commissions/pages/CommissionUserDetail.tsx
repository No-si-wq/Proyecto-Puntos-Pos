import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Tag, Card, Statistic, Row, Col, Button, Typography } from "antd";
import dayjs from "dayjs"
import { useCommissions } from "../hooks/useCommissions";
import { useCommissionReport } from "../hooks/useCommissionReport";
import { formatCurrency } from "../../../core/utils/formatters";
import PageHeader from "../../../core/components/common/PageHeader";

const { Text } = Typography;

export default function CommissionUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const { commissionHistory, loading, fetchByUser } = useCommissions();
  const { data: reportData, fetch: fetchReport } = useCommissionReport();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    fetchByUser(Number(userId));
    fetchReport(null);
  }, [userId]);

  const userSummary = reportData.find((r) => r.userId === Number(userId));

  const columns = [
    {
      title: "Fecha",
      dataIndex: "createdAt",
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Venta #",
      dataIndex: ["sale", "saleNumber"]
    },
    {
      title: "Tipo",
      dataIndex: "type",
      render: (v: string) => (
        <Tag color={v === "SALE" ? "green" : "red"}>
          {v === "SALE" ? "Venta" : "Reversión"}
        </Tag>
      ),
    },
    {
      title: "Porcentaje",
      dataIndex: "percent",
      render: (v: string) => `${v}%`,
    },
    {
      title: "Monto",
      dataIndex: "amount",
      align: "right" as const,
      render: (v: string) => (
        <Text type={undefined}>{formatCurrency(Number(v))}</Text>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Detalle de comisiones"
        subtitle="Comisiones asignadas al vendedor"
        extra={
          <Button
            onClick={() => navigate(-1)}
          >
            Volver
          </Button>
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Total devengado"
              value={Number(userSummary?.earned ?? 0)}
              precision={2}
              prefix="$"
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Total revertido"
              value={Number(userSummary?.reversed ?? 0)}
              precision={2}
              prefix="$"
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Comisión neta"
              value={Number(userSummary?.net ?? 0)}
              precision={2}
              prefix="$"
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          dataSource={commissionHistory}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </>
  );
}