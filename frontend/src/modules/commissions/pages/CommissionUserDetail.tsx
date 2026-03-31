import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tag, Card, Statistic, Row, Col, Button, Typography, Divider } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useCommissions } from "../hooks/useCommissions";
import { useCommissionReport } from "../hooks/useCommissionReport";
import { formatCurrency } from "../../../core/utils/formatters";
import PageHeader from "../../../core/components/common/PageHeader";
import SimpleTable from "../../../core/components/table/SimpleTable";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

interface CommissionRecord {
  id: number;
  createdAt: string;
  type: string;
  percent: string;
  amount: string;
  sale?: { saleNumber: string | number };
}

function CommissionMobileCard({ record }: { record: CommissionRecord }) {
  const isSale = record.type === "SALE";
  return (
    <Card
      size="small"
      style={{
        borderRadius: 10,
        boxShadow: "0 1px 4px rgba(0,0,0,.08)",
        borderLeft: `3px solid ${isSale ? "#52c41a" : "#ff4d4f"}`,
      }}
      styles={{ body: { padding: "10px 14px" } }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(record.createdAt).format("DD/MM/YYYY HH:mm")}
        </Text>
        <Tag color={isSale ? "green" : "red"} style={{ marginRight: 0 }}>
          {isSale ? "Venta" : "Reversión"}
        </Tag>
      </div>

      <Divider style={{ margin: "8px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {record.sale?.saleNumber && (
            <Text style={{ fontSize: 13 }}>
              <Text type="secondary">Venta #</Text>{" "}
              <Text strong>{record.sale.saleNumber}</Text>
            </Text>
          )}
          <Text style={{ fontSize: 13 }}>
            <Text type="secondary">Comisión: </Text>
            <Text>{record.percent}%</Text>
          </Text>
        </div>
        <Text
          strong
          style={{
            fontSize: 16,
            color: isSale ? "#52c41a" : "#ff4d4f",
          }}
        >
          {isSale ? "+" : "-"}
          {formatCurrency(Math.abs(Number(record.amount)))}
        </Text>
      </div>
    </Card>
  );
}

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

  const columns: ColumnsType<CommissionRecord> = [
    {
      title: "Fecha",
      dataIndex: "createdAt",
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Venta #",
      dataIndex: ["sale", "saleNumber"],
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
      render: (v: string, record) => {
        const isSale = record.type === "SALE";
        return (
          <Text style={{ color: isSale ? "#52c41a" : "#ff4d4f" }}>
            {isSale ? "+" : "-"}
            {formatCurrency(Math.abs(Number(v)))}
          </Text>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Detalle de comisiones"
        subtitle="Comisiones asignadas al vendedor"
        extra={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            Volver
          </Button>
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={8}>
          <Card size="small" style={{ textAlign: "center" }}>
            <Statistic
              title="Devengado"
              value={Number(userSummary?.earned ?? 0)}
              precision={2}
              prefix="$"
              valueStyle={{ color: "#52c41a", fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small" style={{ textAlign: "center" }}>
            <Statistic
              title="Revertido"
              value={Number(userSummary?.reversed ?? 0)}
              precision={2}
              prefix="$"
              valueStyle={{ color: "#ff4d4f", fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small" style={{ textAlign: "center" }}>
            <Statistic
              title="Neto"
              value={Number(userSummary?.net ?? 0)}
              precision={2}
              prefix="$"
              valueStyle={{ color: "#1677ff", fontSize: 18 }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <SimpleTable<CommissionRecord>
          columns={columns}
          data={commissionHistory}
          loading={loading}
          mobileRowRender={(record) => <CommissionMobileCard record={record} />}
        />
      </Card>
    </>
  );
}