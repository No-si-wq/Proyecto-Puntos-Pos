import { useState } from "react";
import { Button, Card, Col, Row, Select, Statistic, Table, Tag, Typography } from "antd";
import { FileExcelOutlined, FilePdfOutlined, ClearOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import { useDebouncedCallback } from "use-debounce";

import PageHeader from "../../core/components/common/PageHeader";
import { useReports } from "./useReport";
import { useCustomers } from "../customers/useCustomers";
import type {
  CustomerStatementSummaryRow,
  CustomerStatementInvoiceRow,
} from "./report";
import { exportToExcel } from "../../core/utils/exportExcel";
import { exportToPdf } from "../../core/utils/exportPDF";
import { formatCurrency } from "../../core/utils/formatters";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../core/hooks/useDeviceType";

const { Text } = Typography;

const fmtDate = (v?: string | null) => (v ? dayjs(v).format("DD/MM/YYYY") : "—");

function statusTag(r: CustomerStatementInvoiceRow) {
  if (r.status === "OVERDUE")
    return <Tag color="red">Vencida ({r.daysOverdue} d)</Tag>;
  if (r.status === "PARTIAL") return <Tag color="blue">Parcial</Tag>;
  return <Tag color="orange">Pendiente</Tag>;
}

function statusText(r: CustomerStatementInvoiceRow) {
  if (r.status === "OVERDUE") return `Vencida (${r.daysOverdue} d)`;
  if (r.status === "PARTIAL") return "Parcial";
  return "Pendiente";
}

export default function CustomerStatementReport() {
  const {
    customerStatement: data,
    loading,
    fetchCustomerStatement,
    clearCustomerStatement,
  } = useReports();
  const sizes = useResponsiveSizes();
  const { isMobile } = useDeviceType();

  const {
    customers,
    loading: loadingCustomers,
    setFilters: setFiltersCustomer,
  } = useCustomers();

  const [customerId, setCustomerId] = useState<number>();
  // Modo con el que se hizo la última consulta (no cambia al mover el Select)
  const [mode, setMode] = useState<"general" | "customer" | null>(null);

  const handleSearchCustomer = useDebouncedCallback((value: string) => {
    setFiltersCustomer({ search: value });
  }, 400);

  const handleSearch = async () => {
    await fetchCustomerStatement(customerId ? { customerId } : undefined);
    setMode(customerId ? "customer" : "general");
  };

  const handleClear = () => {
    clearCustomerStatement();
    setCustomerId(undefined);
    setMode(null);
  };

  const summary = data.summary;
  const invoices = data.invoices;
  const customer = mode === "customer" ? summary[0] : undefined;

  const totals = summary.reduce(
    (acc, r) => ({
      openInvoices: acc.openInvoices + r.openInvoices,
      totalCredit: acc.totalCredit + r.totalCredit,
      totalPaid: acc.totalPaid + r.totalPaid,
      balance: acc.balance + r.balance,
      overdueBalance: acc.overdueBalance + r.overdueBalance,
    }),
    { openInvoices: 0, totalCredit: 0, totalPaid: 0, balance: 0, overdueBalance: 0 }
  );

  const hasData = summary.length > 0;

  // ── Exportaciones ─────────────────────────────────────────────
  const handleExcel = () => {
    if (mode === "customer") {
      const rows: Record<string, any>[] = invoices.map((r) => ({
        Factura: r.saleNumber,
        "Fecha Factura": fmtDate(r.saleDate),
        Vencimiento: fmtDate(r.dueDate),
        Total: r.total,
        Abonado: r.paidAmount,
        Saldo: r.balance,
        "Último Abono": fmtDate(r.lastPaymentDate),
        Estado: statusText(r),
      }));
      rows.push({
        Factura: "TOTAL",
        Total: totals.totalCredit,
        Abonado: totals.totalPaid,
        Saldo: totals.balance,
      });
      exportToExcel(rows, `Estado_Cuenta_${customer?.name ?? "Cliente"}`);
      return;
    }

    const rows: Record<string, any>[] = summary.map((r) => ({
      Cliente: r.name,
      DNI: r.dni ?? "",
      Teléfono: r.phone ?? "",
      "Límite Crédito": r.creditLimit ?? "",
      "Facturas Abiertas": r.openInvoices,
      "Total Crédito": r.totalCredit,
      Abonado: r.totalPaid,
      Saldo: r.balance,
      "Saldo Vencido": r.overdueBalance,
    }));
    rows.push({
      Cliente: "TOTAL",
      "Facturas Abiertas": totals.openInvoices,
      "Total Crédito": totals.totalCredit,
      Abonado: totals.totalPaid,
      Saldo: totals.balance,
      "Saldo Vencido": totals.overdueBalance,
    });
    exportToExcel(rows, "Estado_Cuenta_General");
  };

  const handlePdf = () => {
    if (mode === "customer") {
      exportToPdf(
        `Estado de Cuenta - ${customer?.name ?? ""}`,
        [
          { header: "Factura", dataKey: "Factura" },
          { header: "Fecha", dataKey: "Fecha" },
          { header: "Vence", dataKey: "Vence" },
          { header: "Total", dataKey: "Total" },
          { header: "Abonado", dataKey: "Abonado" },
          { header: "Saldo", dataKey: "Saldo" },
          { header: "Estado", dataKey: "Estado" },
        ],
        [
          ...invoices.map((r) => ({
            Factura: r.saleNumber,
            Fecha: fmtDate(r.saleDate),
            Vence: fmtDate(r.dueDate),
            Total: formatCurrency(r.total),
            Abonado: formatCurrency(r.paidAmount),
            Saldo: formatCurrency(r.balance),
            Estado: statusText(r),
          })),
          {
            Factura: "TOTAL",
            Fecha: "",
            Vence: "",
            Total: formatCurrency(totals.totalCredit),
            Abonado: formatCurrency(totals.totalPaid),
            Saldo: formatCurrency(totals.balance),
            Estado: "",
          },
        ],
        `Estado_Cuenta_${customer?.name ?? "Cliente"}`
      );
      return;
    }

    exportToPdf(
      "Estado de Cuenta General",
      [
        { header: "Cliente", dataKey: "Cliente" },
        { header: "Facturas", dataKey: "Facturas" },
        { header: "Total Crédito", dataKey: "Total Crédito" },
        { header: "Abonado", dataKey: "Abonado" },
        { header: "Saldo", dataKey: "Saldo" },
        { header: "Vencido", dataKey: "Vencido" },
      ],
      [
        ...summary.map((r) => ({
          Cliente: r.name,
          Facturas: r.openInvoices,
          "Total Crédito": formatCurrency(r.totalCredit),
          Abonado: formatCurrency(r.totalPaid),
          Saldo: formatCurrency(r.balance),
          Vencido: formatCurrency(r.overdueBalance),
        })),
        {
          Cliente: "TOTAL",
          Facturas: totals.openInvoices,
          "Total Crédito": formatCurrency(totals.totalCredit),
          Abonado: formatCurrency(totals.totalPaid),
          Saldo: formatCurrency(totals.balance),
          Vencido: formatCurrency(totals.overdueBalance),
        },
      ],
      "Estado_Cuenta_General"
    );
  };

  // ── Columnas ──────────────────────────────────────────────────
  const generalColumns: ColumnsType<CustomerStatementSummaryRow> = isMobile
    ? [
        {
          title: "Cliente",
          render: (_, r) => (
            <div>
              <Text strong style={{ display: "block" }}>{r.name}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {r.openInvoices} factura(s)
              </Text>
            </div>
          ),
        },
        {
          title: "Saldo",
          align: "right",
          render: (_, r) => (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 600 }}>{formatCurrency(r.balance)}</div>
              {r.overdueBalance > 0 && (
                <div style={{ fontSize: 11, color: "#cf1322" }}>
                  Vencido: {formatCurrency(r.overdueBalance)}
                </div>
              )}
            </div>
          ),
        },
      ]
    : [
        { title: "Cliente", dataIndex: "name", width: 200, fixed: "left", ellipsis: true },
        { title: "DNI", dataIndex: "dni", width: 140, render: (v) => v ?? "—" },
        { title: "Teléfono", dataIndex: "phone", width: 120, render: (v) => v ?? "—" },
        {
          title: "Límite",
          dataIndex: "creditLimit",
          width: 120,
          align: "right",
          render: (v) => (v == null ? "—" : formatCurrency(v)),
        },
        { title: "Facturas", dataIndex: "openInvoices", width: 90, align: "right" },
        {
          title: "Total crédito",
          dataIndex: "totalCredit",
          width: 130,
          align: "right",
          render: (v) => formatCurrency(v),
        },
        {
          title: "Abonado",
          dataIndex: "totalPaid",
          width: 120,
          align: "right",
          render: (v) => formatCurrency(v),
        },
        {
          title: "Saldo",
          dataIndex: "balance",
          width: 130,
          align: "right",
          render: (v) => <Text strong>{formatCurrency(v)}</Text>,
          sorter: (a, b) => a.balance - b.balance,
        },
        {
          title: "Vencido",
          dataIndex: "overdueBalance",
          width: 130,
          align: "right",
          render: (v) =>
            v > 0 ? <Text type="danger">{formatCurrency(v)}</Text> : formatCurrency(0),
          sorter: (a, b) => a.overdueBalance - b.overdueBalance,
        },
      ];

  const detailColumns: ColumnsType<CustomerStatementInvoiceRow> = isMobile
    ? [
        {
          title: "Factura",
          render: (_, r) => (
            <div>
              <Text strong style={{ display: "block" }}>{r.saleNumber}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {fmtDate(r.saleDate)} · Vence: {fmtDate(r.dueDate)}
              </Text>
              <div style={{ marginTop: 2 }}>{statusTag(r)}</div>
            </div>
          ),
        },
        {
          title: "Saldo",
          align: "right",
          render: (_, r) => (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 600 }}>{formatCurrency(r.balance)}</div>
              <div style={{ fontSize: 11, color: "#888" }}>
                de {formatCurrency(r.total)}
              </div>
            </div>
          ),
        },
      ]
    : [
        { title: "Factura", dataIndex: "saleNumber", width: 140, fixed: "left" },
        { title: "Fecha", dataIndex: "saleDate", width: 110, render: fmtDate },
        { title: "Vence", dataIndex: "dueDate", width: 110, render: fmtDate },
        {
          title: "Total",
          dataIndex: "total",
          width: 120,
          align: "right",
          render: (v) => formatCurrency(v),
        },
        {
          title: "Abonado",
          dataIndex: "paidAmount",
          width: 120,
          align: "right",
          render: (v) => formatCurrency(v),
        },
        {
          title: "Saldo",
          dataIndex: "balance",
          width: 120,
          align: "right",
          render: (v) => <Text strong>{formatCurrency(v)}</Text>,
        },
        { title: "Último abono", dataIndex: "lastPaymentDate", width: 120, render: fmtDate },
        { title: "Estado", width: 150, render: (_, r) => statusTag(r) },
      ];

  return (
    <div>
      <PageHeader
        title="Estado de Cuenta"
        subtitle="Crédito de clientes: general o detallado por cliente"
      />

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Select
          allowClear
          showSearch
          placeholder="Todos los clientes (general)"
          size={sizes.select}
          style={{ width: isMobile ? "100%" : 300 }}
          loading={loadingCustomers}
          filterOption={false}
          onSearch={handleSearchCustomer}
          value={customerId}
          onChange={(v) => setCustomerId(v)}
          options={customers.map((c) => ({ label: c.name, value: c.id }))}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="primary"
            size={sizes.button}
            loading={loading}
            onClick={handleSearch}
            style={isMobile ? { flex: 1 } : undefined}
          >
            Consultar
          </Button>
          <Button
            icon={<ClearOutlined />}
            size={sizes.button}
            disabled={!mode}
            onClick={handleClear}
            style={isMobile ? { flex: 1 } : undefined}
          >
            Limpiar
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            size={sizes.button}
            disabled={!hasData}
            onClick={handleExcel}
          >
            {!isMobile && "Excel"}
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            size={sizes.button}
            disabled={!hasData}
            onClick={handlePdf}
          >
            {!isMobile && "PDF"}
          </Button>
        </div>
      </div>

      {mode === "customer" && customer && (
        <Card size="small" style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 16 }}>{customer.name}</Text>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
            {[customer.dni, customer.phone].filter(Boolean).join(" · ")}
          </div>
          <Row gutter={[12, 12]}>
            <Col xs={12} sm={6}>
              <Statistic title="Total crédito" value={formatCurrency(customer.totalCredit)} valueStyle={{ fontSize: isMobile ? 16 : undefined }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="Abonado" value={formatCurrency(customer.totalPaid)} valueStyle={{ fontSize: isMobile ? 16 : undefined }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="Saldo" value={formatCurrency(customer.balance)} valueStyle={{ fontSize: isMobile ? 16 : undefined }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Vencido"
                value={formatCurrency(customer.overdueBalance)}
                valueStyle={{
                  fontSize: isMobile ? 16 : undefined,
                  color: customer.overdueBalance > 0 ? "#cf1322" : undefined,
                }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {mode === "customer" ? (
        <Table<CustomerStatementInvoiceRow>
          rowKey="id"
          columns={detailColumns}
          dataSource={invoices}
          loading={loading}
          size={isMobile ? "small" : "middle"}
          pagination={{ pageSize: 50, showSizeChanger: !isMobile, simple: isMobile }}
          scroll={!isMobile ? { x: 900 } : undefined}
          locale={{ emptyText: "El cliente no tiene facturas pendientes" }}
          summary={() =>
            invoices.length ? (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  {isMobile ? (
                    <>
                      <Table.Summary.Cell index={0}><Text strong>TOTAL</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong>{formatCurrency(totals.balance)}</Text>
                      </Table.Summary.Cell>
                    </>
                  ) : (
                    <>
                      <Table.Summary.Cell index={0} colSpan={3}><Text strong>TOTAL</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right"><Text strong>{formatCurrency(totals.totalCredit)}</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right"><Text strong>{formatCurrency(totals.totalPaid)}</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={5} align="right"><Text strong>{formatCurrency(totals.balance)}</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={6} colSpan={2} />
                    </>
                  )}
                </Table.Summary.Row>
              </Table.Summary>
            ) : null
          }
        />
      ) : (
        <Table<CustomerStatementSummaryRow>
          rowKey="customerId"
          columns={generalColumns}
          dataSource={summary}
          loading={loading}
          size={isMobile ? "small" : "middle"}
          pagination={{ pageSize: 50, showSizeChanger: !isMobile, simple: isMobile }}
          scroll={!isMobile ? { x: 1100 } : undefined}
          locale={{ emptyText: "Presiona Consultar para cargar el estado de cuenta" }}
          onRow={(r) => ({
            onClick: () => setCustomerId(r.customerId),
            style: { cursor: "pointer" },
          })}
          summary={() =>
            summary.length ? (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  {isMobile ? (
                    <>
                      <Table.Summary.Cell index={0}><Text strong>TOTAL</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong>{formatCurrency(totals.balance)}</Text>
                      </Table.Summary.Cell>
                    </>
                  ) : (
                    <>
                      <Table.Summary.Cell index={0} colSpan={4}><Text strong>TOTAL</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right"><Text strong>{totals.openInvoices}</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={5} align="right"><Text strong>{formatCurrency(totals.totalCredit)}</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={6} align="right"><Text strong>{formatCurrency(totals.totalPaid)}</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={7} align="right"><Text strong>{formatCurrency(totals.balance)}</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={8} align="right"><Text strong type="danger">{formatCurrency(totals.overdueBalance)}</Text></Table.Summary.Cell>
                    </>
                  )}
                </Table.Summary.Row>
              </Table.Summary>
            ) : null
          }
        />
      )}
    </div>
  );
}