import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Tag, Card, Statistic, Row, Col, Button } from "antd";
import { useCommissions } from "../hooks/useCommissions";
import { useCommissionReport } from "../hooks/useCommissionReport";
import PageHeader from "../../../core/components/common/PageHeader";

export default function CommissionUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const { userCommissions, loading, fetchByUser } = useCommissions();
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
      title: "Nivel",
      dataIndex: ["level", "name"],
    },
    {
      title: "Porcentaje",
      dataIndex: "percent",
      render: (v: number) => `${v}%`,
    },
    {
      title: "Estado",
      dataIndex: "active",
      render: (v: boolean) => (
        <Tag color={v ? "green" : "red"}>{v ? "Activa" : "Inactiva"}</Tag>
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
          dataSource={userCommissions}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </>
  );
}