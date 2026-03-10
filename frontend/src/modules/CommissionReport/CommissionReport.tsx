import { useEffect, useState } from "react";
import {
  Table,
  Card,
  DatePicker,
  Button,
  Space,
  Typography,
  Statistic,
  Row,
  Col,
  Tag,
} from "antd";
import { FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import { Dayjs } from "dayjs";
import http from "../../core/http/http";
import { formatCurrency } from "../../core/utils/formatters";
import PageHeader from "../../core/components/common/PageHeader";
import { exportToPdf } from "../../core/utils/exportPDF";
import * as XLSX from "xlsx";

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface CommissionRow {
  userId: number;
  userName: string;
  totalSales: number;
  earned: number;
  reversed: number;
  net: number;
}

export default function CommissionReport() {
  const [data, setData] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState<[Dayjs, Dayjs] | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dates) {
        params.from = dates[0].startOf("day").toISOString();
        params.to = dates[1].endOf("day").toISOString();
      }
      const { data: rows } = await http.get("/commission-report", { params });
      setData(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Totales para las estadísticas del header
  const totalEarned = data.reduce((acc, r) => acc + Number(r.earned), 0);
  const totalReversed = data.reduce((acc, r) => acc + Number(r.reversed), 0);
  const totalNet = data.reduce((acc, r) => acc + Number(r.net), 0);

  function handleExportPdf() {
    const rows = data.map((r) => ({
      Vendedor: r.userName,
      Ventas: r.totalSales,
      Devengado: formatCurrency(r.earned),
      Revertido: formatCurrency(r.reversed),
      Neto: formatCurrency(r.net),
    }));

    exportToPdf(
      "Reporte de Comisiones",
      [
        { header: "Vendedor", dataKey: "Vendedor" },
        { header: "Ventas", dataKey: "Ventas" },
        { header: "Devengado", dataKey: "Devengado" },
        { header: "Revertido", dataKey: "Revertido" },
        { header: "Neto", dataKey: "Neto" },
      ],
      rows,
      "reporte_comisiones"
    );
  }

  function handleExportExcel() {
    const rows = data.map((r) => ({
      Vendedor: r.userName,
      "Ventas realizadas": r.totalSales,
      "Comisión devengada": Number(r.earned),
      "Comisión revertida": Number(r.reversed),
      "Comisión neta": Number(r.net),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comisiones");
    XLSX.writeFile(wb, "reporte_comisiones.xlsx");
  }

  const columns = [
    {
      title: "Vendedor",
      dataIndex: "userName",
      sorter: (a: CommissionRow, b: CommissionRow) =>
        a.userName.localeCompare(b.userName),
    },
    {
      title: "Ventas",
      dataIndex: "totalSales",
      align: "right" as const,
      sorter: (a: CommissionRow, b: CommissionRow) => a.totalSales - b.totalSales,
    },
    {
      title: "Devengado",
      dataIndex: "earned",
      align: "right" as const,
      sorter: (a: CommissionRow, b: CommissionRow) =>
        Number(a.earned) - Number(b.earned),
      render: (v: number) => formatCurrency(v),
    },
    {
      title: "Revertido",
      dataIndex: "reversed",
      align: "right" as const,
      sorter: (a: CommissionRow, b: CommissionRow) =>
        Number(a.reversed) - Number(b.reversed),
      render: (v: number) =>
        Number(v) > 0 ? (
          <Text type="danger">- {formatCurrency(v)}</Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Neto",
      dataIndex: "net",
      align: "right" as const,
      sorter: (a: CommissionRow, b: CommissionRow) =>
        Number(a.net) - Number(b.net),
      render: (v: number) => (
        <Tag color={Number(v) > 0 ? "green" : "default"}>
          {formatCurrency(v)}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Reporte de comisiones"
        subtitle="Comisiones netas por vendedor"
        extra={
          <Space>
            <RangePicker
              value={dates}
              onChange={(val) => setDates(val as [Dayjs, Dayjs] | null)}
              format="DD/MM/YYYY"
            />
            <Button type="primary" onClick={load} loading={loading}>
              Consultar
            </Button>
            <Button icon={<FilePdfOutlined />} onClick={handleExportPdf}>
              PDF
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
              Excel
            </Button>
          </Space>
        }
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total devengado"
              value={totalEarned}
              precision={2}
              prefix="$"
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total revertido"
              value={totalReversed}
              precision={2}
              prefix="$"
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Comisión neta total"
              value={totalNet}
              precision={2}
              prefix="$"
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>
      </Row>

      <Table
        dataSource={data}
        columns={columns}
        rowKey="userId"
        loading={loading}
        pagination={false}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0}>
              <Text strong>Total</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="right">
              <Text strong>
                {data.reduce((acc, r) => acc + r.totalSales, 0)}
              </Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} align="right">
              <Text strong>{formatCurrency(totalEarned)}</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={3} align="right">
              <Text strong type="danger">
                - {formatCurrency(totalReversed)}
              </Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="right">
              <Text strong style={{ color: "#1677ff" }}>
                {formatCurrency(totalNet)}
              </Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </>
  );
}