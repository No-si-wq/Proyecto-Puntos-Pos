import { useState } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  Typography,
  Statistic,
  Row,
  Col,
  Tag,
  Drawer,
  Divider,
} from "antd";
import {
  FileExcelOutlined,
  FilePdfOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Dayjs } from "dayjs";
import { formatCurrency } from "../../../core/utils/formatters";
import PageHeader from "../../../core/components/common/PageHeader";
import { exportToPdf } from "../../../core/utils/exportPDF";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import { useCommissionReport } from "../hooks/useCommissionReport";
import type { CommissionRow } from "../types/commission";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import ResponsiveRangePicker from "../../../core/components/common/ResponsiveRangePicker";

const { Text } = Typography;

export default function CommissionReport() {
  const navigate = useNavigate();
  const { data, loading, fetch: fetchReport } = useCommissionReport();
  const [dates, setDates] = useState<[Dayjs, Dayjs] | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const { isMobile, isTablet } = useDeviceType();
  const isCompact = isMobile || isTablet;

  async function load() {
    await fetchReport(dates);
    if (isMobile) setFilterOpen(false);
  }

  function clearFilter() {
    setDates(null);
    fetchReport();
    if(isMobile) setFilterOpen(false);
  }

  const totalEarned = data.reduce((acc, r) => acc + Number(r.earned), 0);
  const totalReversed = data.reduce((acc, r) => acc + Number(r.reversed), 0);
  const totalNet = data.reduce((acc, r) => acc + Number(r.net), 0);

  function handleExportPdf() {
    const rows = data.map((r) => ({
      "Vendedor": r.sellers?.join(", ") ?? "—",
      Ventas: r.totalSales,
      Devengado: formatCurrency(r.earned),
      Revertido: formatCurrency(r.reversed),
      "Monto vendido": formatCurrency(r.sellerSalesAmount),
      Neto: formatCurrency(r.net),
    }));
    exportToPdf(
      "Reporte de Comisiones",
      [
        { header: "Vendedor", dataKey: "Vendedor" },
        { header: "Ventas", dataKey: "Ventas" },
        { header: "Devengado", dataKey: "Devengado" },
        { header: "Revertido", dataKey: "Revertido" },
        { header: "Monto vendido", dataKey: "Monto vendido" },
        { header: "Neto", dataKey: "Neto" },
      ],
      rows,
      "reporte_comisiones"
    );
  }

  function handleExportExcel() {
    const rows = data.map((r) => ({
      "Vendedor": r.sellers?.join(", ") ?? "—",
      "Ventas realizadas": r.totalSales,
      "Comisión devengada": Number(r.earned),
      "Comisión revertida": Number(r.reversed),
      "Monto vendido": Number(r.sellerSalesAmount),
      "Comisión neta": Number(r.net),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comisiones");
    XLSX.writeFile(wb, "reporte_comisiones.xlsx");
  }

  const desktopColumns = [
    {
      title: "Vendedor",
      dataIndex: "sellers",
      render: (sellers: string[]) =>
        sellers?.length
          ? sellers.map((s) => <Tag key={s}>{s}</Tag>)
          : <Text type="secondary">—</Text>,
    },
    {
      title: "Ventas",
      dataIndex: "totalSales",
      align: "right" as const,
      sorter: (a: CommissionRow, b: CommissionRow) =>
        a.totalSales - b.totalSales,
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
      title: "Monto vendido",
      dataIndex: "sellerSalesAmount",
      align: "right" as const,
      sorter: (a: CommissionRow, b: CommissionRow) =>
        Number(a.sellerSalesAmount) - Number(b.sellerSalesAmount),
      render: (v: number) =>
        Number(v) > 0 ? formatCurrency(v) : <Text type="secondary">—</Text>,
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

  const mobileColumns = [
    {
      title: "Vendedor",
      dataIndex: "sellers",
      sorter: (a: CommissionRow, b: CommissionRow) =>
        a.sellerNames.localeCompare(b.sellerNames),
      render: (name: string, record: CommissionRow) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.totalSales} venta{record.totalSales !== 1 ? "s" : ""}
          </Text>
        </div>
      ),
    },
    {
      title: "Neto",
      dataIndex: "net",
      align: "right" as const,
      render: (v: number, record: CommissionRow) => (
        <div style={{ textAlign: "right" }}>
          <Tag color={Number(v) > 0 ? "green" : "default"}>
            {formatCurrency(v)}
          </Tag>
          {Number(record.reversed) > 0 && (
            <div style={{ marginTop: 4 }}>
              <Text type="danger" style={{ fontSize: 11 }}>
                - {formatCurrency(record.reversed)}
              </Text>
            </div>
          )}
        </div>
      ),
    },
  ];

  const expandedRowRender = (record: CommissionRow) => (
    <div style={{ padding: "8px 0" }}>
      <Row gutter={8}>
      <Col span={6}>
        <Text type="secondary" style={{ fontSize: 12 }}>Monto vendido</Text>
        <div style={{ fontWeight: 500 }}>
          {Number(record.sellerSalesAmount) > 0
            ? formatCurrency(record.sellerSalesAmount)
            : <Text type="secondary">—</Text>}
        </div>
      </Col>
        <Col span={8}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Devengado
          </Text>
          <div style={{ fontWeight: 500 }}>{formatCurrency(record.earned)}</div>
        </Col>
        <Col span={8}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Revertido
          </Text>
          <div>
            {Number(record.reversed) > 0 ? (
              <Text type="danger">- {formatCurrency(record.reversed)}</Text>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </div>
        </Col>
        <Col span={8}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Ventas
          </Text>
          <div style={{ fontWeight: 500 }}>{record.totalSales}</div>
        </Col>
      </Row>
    </div>
  );

  const filterContent = (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <div>
        <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
          Rango de fechas
        </Text>
        <ResponsiveRangePicker
          value={dates}
          onChange={(val) => setDates(val as [Dayjs, Dayjs] | null)}
          format="DD/MM/YYYY"
          style={{ width: "100%" }}
        />
      </div>
      <Button
        type="primary"
        block
        onClick={load}
        loading={loading}
        icon={<ReloadOutlined />}
      >
        Consultar
      </Button>

      <Button 
        type="primary"
        block
        onClick={clearFilter}
      >
        Limpiar
      </Button>

      <Divider style={{ margin: "8px 0" }} />
      <Text type="secondary" style={{ fontSize: 12 }}>
        Exportar
      </Text>
      <Space style={{ width: "100%" }}>
        <Button
          icon={<FilePdfOutlined />}
          onClick={handleExportPdf}
          style={{ flex: 1 }}
        >
          PDF
        </Button>
        <Button
          icon={<FileExcelOutlined />}
          onClick={handleExportExcel}
          style={{ flex: 1 }}
        >
          Excel
        </Button>
      </Space>
    </Space>
  );

  const headerExtra = isMobile ? (
    <Button
      icon={<FilterOutlined />}
      onClick={() => setFilterOpen(true)}
      type={dates ? "primary" : "default"}
    >
      Filtrar
    </Button>
  ) : (
    <Space wrap>
      <ResponsiveRangePicker
        value={dates}
        onChange={(val) => setDates(val as [Dayjs, Dayjs] | null)}
        format="DD/MM/YYYY"
      />
      <Button type="primary" onClick={load} loading={loading}>
        Consultar
      </Button>
      <Button onClick={clearFilter}>
        Limpiar
      </Button>
      <Button icon={<FilePdfOutlined />} onClick={handleExportPdf}>
        PDF
      </Button>
      <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
        Excel
      </Button>
    </Space>
  );

  return (
    <>
      <PageHeader
        title="Reporte de comisiones"
        subtitle="Comisiones netas por vendedor"
        extra={headerExtra}
      />

      <Drawer
        title="Filtros"
        placement="bottom"
        height="auto"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        styles={{ body: { paddingBottom: 32 } }}
      >
        {filterContent}
      </Drawer>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size={isCompact ? "small" : "default"}>
            <Statistic
              title="Total devengado"
              value={totalEarned}
              precision={2}
              prefix="L. "
              valueStyle={{ color: "#52c41a", fontSize: isMobile ? 18 : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size={isCompact ? "small" : "default"}>
            <Statistic
              title="Total revertido"
              value={totalReversed}
              precision={2}
              prefix="L. "
              valueStyle={{ color: "#ff4d4f", fontSize: isMobile ? 18 : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size={isCompact ? "small" : "default"}>
            <Statistic
              title="Comisión neta total"
              value={totalNet}
              precision={2}
              prefix="L. "
              valueStyle={{ color: "#1677ff", fontSize: isMobile ? 18 : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Table
        dataSource={data}
        columns={isMobile ? mobileColumns : desktopColumns}
        rowKey="userId"
        loading={loading}
        pagination={false}
        size={isCompact ? "small" : "middle"}
        scroll={isCompact ? { x: true } : undefined}
        onRow={(record) => ({
          onClick: () => navigate(`/commissions/user/${record.userId}`),
          style: { cursor: "pointer" },
        })}
        expandable={
          isMobile
            ? {
                expandedRowRender,
                rowExpandable: () => true,
              }
            : undefined
        }
        summary={
          isMobile
            ? undefined
            : () => (
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
                  <Table.Summary.Cell index={2} align="right">
                    <Text strong>
                      {formatCurrency(data.reduce((acc, r) => acc + Number(r.sellerSalesAmount), 0))}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <Text strong style={{ color: "#1677ff" }}>
                      {formatCurrency(totalNet)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )
        }
      />
    </>
  );
}