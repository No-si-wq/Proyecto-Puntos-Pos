import { Table, DatePicker, Button, Tag, Space, Typography, Dropdown } from "antd";
import { MoreOutlined, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import dayjs from "dayjs";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import { useResponsiveSizes } from "../../../core/hooks/useResponsiveSizes";
import { useTransferReport } from "../hooks/useTransferReport";
import { exportToExcel } from "../../../core/utils/exportExcel";
import { exportToPdf } from "../../../core/utils/exportPDF";
import PageHeader from "../../../core/components/common/PageHeader";
import type { TransferReportItem } from "../types/inventory";

const { RangePicker } = DatePicker;
const { Text } = Typography;

export default function TransferReport() {
  const { isMobile } = useDeviceType();
  const sizes = useResponsiveSizes();
  const { loading, data, setFilters, search } = useTransferReport();

  const columns = [
    {
      title: "Fecha",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
      width: 150,
    },
    {
      title: "Producto",
      key: "product",
      render: (_: unknown, r: TransferReportItem) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.product.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.product.sku}</Text>
        </Space>
      ),
    },
    {
      title: "Origen",
      dataIndex: ["fromWarehouse", "name"],
      key: "from",
      render: (v: string) => <Tag color="orange">{v}</Tag>,
    },
    {
      title: "Destino",
      dataIndex: ["toWarehouse", "name"],
      key: "to",
      render: (v: string) => <Tag color="green">{v ?? "—"}</Tag>,
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
      align: "right" as const,
      width: 100,
    },
    {
      title: "Valor (costo)",
      dataIndex: "movementValue",
      key: "movementValue",
      align: "right" as const,
      width: 130,
      render: (v: string) =>
        Number(v).toLocaleString("es-HN", { style: "currency", currency: "HNL" }),
    },
    {
      title: "Nota",
      dataIndex: "note",
      key: "note",
      render: (v: string | null) => v ?? "—",
    },
  ];

  function buildExportRows() {
    return data.map((r) => ({
      Fecha:        dayjs(r.createdAt).format("DD/MM/YYYY HH:mm"),
      Producto:     r.product.name,
      SKU:          r.product.sku,
      Origen:       r.fromWarehouse.name,
      Destino:      r.toWarehouse?.name ?? "—",
      Cantidad:     r.quantity,
      Valor_Costo:  Number(r.movementValue),
      Nota:         r.note ?? "—",
    }));
  }

  function handleExportExcel() {
    exportToExcel(buildExportRows(), "transferencias");
  }

  function handleExportPdf() {
    exportToPdf(
      "Reporte de Transferencias",
      [
        { header: "Fecha",        dataKey: "Fecha"       },
        { header: "Producto",     dataKey: "Producto"    },
        { header: "SKU",          dataKey: "SKU"         },
        { header: "Origen",       dataKey: "Origen"      },
        { header: "Destino",      dataKey: "Destino"     },
        { header: "Cantidad",     dataKey: "Cantidad"    },
        { header: "Valor (costo)", dataKey: "Valor_Costo" },
        { header: "Nota",         dataKey: "Nota"        },
      ],
      buildExportRows(),
      "transferencias"
    );
  }

  const exportMenu: MenuProps = {
    items: [
      { key: "excel", label: "Exportar Excel", icon: <FileExcelOutlined />, onClick: handleExportExcel },
      { key: "pdf",   label: "Exportar PDF",   icon: <FilePdfOutlined />,   onClick: handleExportPdf   },
    ],
  };

  return (
    <>
      <PageHeader
        title="Reporte de Transferencias"
        extra={
          isMobile ? (
            <div style={{ textAlign: "right" }}>
              <Dropdown menu={exportMenu} trigger={["click"]} placement="bottomRight">
                <Button icon={<MoreOutlined />} size="small" />
              </Dropdown>
            </div>
          ) : (
            <Space>
              <Button size={sizes.button} onClick={handleExportExcel}>Exportar Excel</Button>
              <Button size={sizes.button} onClick={handleExportPdf}>Exportar PDF</Button>
            </Space>
          )
        }
      />

      <div style={{ marginBottom: 12 }}>
        <Space wrap>
          <RangePicker
            onChange={(_, s) => {
              const [from, to] = s as [string, string];
              setFilters({ from: from || undefined, to: to || undefined });
            }}
          />
          <Button type="primary" size={sizes.button} loading={loading} onClick={search}>
            Buscar
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="small"
        summary={(rows) => {
          const totalQty = rows.reduce((s, r) => s + r.quantity, 0);
          const totalVal = rows.reduce((s, r) => s + Number(r.movementValue), 0);
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4}>
                <Text strong>Total</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                <Text strong>{totalQty}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <Text strong>
                  {totalVal.toLocaleString("es-HN", { style: "currency", currency: "HNL" })}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} />
            </Table.Summary.Row>
          );
        }}
      />
    </>
  );
}