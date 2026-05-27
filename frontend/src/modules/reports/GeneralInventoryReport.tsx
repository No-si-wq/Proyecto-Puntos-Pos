import { Button, Table, Tag, Typography } from "antd";
import { FileExcelOutlined, FilePdfOutlined, ClearOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import PageHeader from "../../core/components/common/PageHeader";
import { useReports } from "./useReport";
import type { GeneralInventoryRow } from "./report";
import { exportToExcel } from "../../core/utils/exportExcel";
import { exportToPdf } from "../../core/utils/exportPDF";
import { formatCurrency } from "../../core/utils/formatters";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../core/hooks/useDeviceType";

const { Text } = Typography;

export default function GeneralInventoryReport() {
  const { generalInventory: data, loading, fetchGeneralInventory, clearGeneralInventory } = useReports();
  const sizes        = useResponsiveSizes();
  const { isMobile } = useDeviceType();

  const totals = data.reduce(
    (acc, r) => ({
      stock:      acc.stock      + r.stock,
      totalValue: acc.totalValue + r.totalValue,
    }),
    { stock: 0, totalValue: 0 }
  );

  const handleExcel = () => {
    exportToExcel(
      data.map((r) => ({
        SKU:               r.sku,
        Producto:          r.name,
        Categoría:         r.category,
        Stock:             r.stock,
        "Costo Unitario":  r.cost,
        "Valor Inventario": r.totalValue,
        "Punto Reorden":   r.reorderPoint,
        Estado:            r.belowReorder ? "Bajo mínimo" : "OK",
      })),
      "Inventario_General"
    );
  };

  const handlePdf = () => {
    exportToPdf(
      "Inventario General",
      [
        { header: "SKU",               dataKey: "SKU"               },
        { header: "Producto",          dataKey: "Producto"          },
        { header: "Categoría",         dataKey: "Categoría"         },
        { header: "Stock",             dataKey: "Stock"             },
        { header: "Valor Inventario",  dataKey: "Valor Inventario"  },
        { header: "Estado",            dataKey: "Estado"            },
      ],
      data.map((r) => ({
        SKU:               r.sku,
        Producto:          r.name,
        Categoría:         r.category,
        Stock:             r.stock,
        "Valor Inventario": formatCurrency(r.totalValue),
        Estado:            r.belowReorder ? "Bajo mínimo" : "OK",
      })),
      "Inventario_General"
    );
  };

  const columns: ColumnsType<GeneralInventoryRow> = [
    { title: "SKU",      dataIndex: "sku",  width: isMobile ? 80 : 110, fixed: isMobile ? undefined : "left" },
    { title: "Producto", dataIndex: "name", width: isMobile ? 140 : 180, fixed: isMobile ? undefined : "left", ellipsis: true },
    ...(!isMobile
      ? [{ title: "Categoría", dataIndex: "category", width: 130 } as const]
      : []),
    {
      title: "Stock",
      dataIndex: "stock",
      width: isMobile ? 70 : 100,
      align: "right" as const,
      sorter: (a: GeneralInventoryRow, b: GeneralInventoryRow) => a.stock - b.stock,
    },
    ...(!isMobile
      ? [{
          title: "Costo Unit.",
          dataIndex: "cost",
          width: 120,
          align: "right" as const,
          render: (v: number) => formatCurrency(v),
        } as const]
      : []),
    {
      title: "Valor",
      dataIndex: "totalValue",
      width: isMobile ? 100 : 130,
      align: "right" as const,
      render: (v: number) => formatCurrency(v),
      sorter: (a: GeneralInventoryRow, b: GeneralInventoryRow) => a.totalValue - b.totalValue,
    },
    ...(!isMobile
      ? [{
          title: "P. Reorden",
          dataIndex: "reorderPoint",
          width: 100,
          align: "right" as const,
        } as const]
      : []),
    {
      title: "Estado",
      dataIndex: "belowReorder",
      width: isMobile ? 80 : 110,
      align: "center" as const,
      render: (v: boolean) =>
        v ? <Tag color="red">Bajo mínimo</Tag> : <Tag color="green">OK</Tag>,
      filters: [
        { text: "Bajo mínimo", value: true },
        { text: "OK",          value: false },
      ],
      onFilter: (value, record) => record.belowReorder === value,
    },
  ];

  return (
    <div>
      <PageHeader title="Inventario General" />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Button
          type="primary"
          size={sizes.button}
          loading={loading}
          onClick={fetchGeneralInventory}
        >
          Consultar
        </Button>
        <Button
          icon={<ClearOutlined />}
          size={sizes.button}
          disabled={!data.length}
          onClick={clearGeneralInventory}
        >
          {!isMobile && "Limpiar"}
        </Button>
        <Button
          icon={<FileExcelOutlined />}
          size={sizes.button}
          disabled={!data.length}
          onClick={handleExcel}
        >
          {!isMobile && "Excel"}
        </Button>
        <Button
          icon={<FilePdfOutlined />}
          size={sizes.button}
          disabled={!data.length}
          onClick={handlePdf}
        >
          {!isMobile && "PDF"}
        </Button>
      </div>

      <Table<GeneralInventoryRow>
        rowKey="productId"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: isMobile ? 480 : 900 }}
        size={isMobile ? "small" : "middle"}
        pagination={{ pageSize: 50, showSizeChanger: !isMobile, simple: isMobile }}
        locale={{ emptyText: "Presiona Consultar para cargar el inventario" }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={isMobile ? 2 : 3}>
                <Text strong>TOTAL</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong>{totals.stock}</Text>
              </Table.Summary.Cell>
              {!isMobile && <Table.Summary.Cell index={2} />}
              <Table.Summary.Cell index={3} align="right">
                <Text strong>{formatCurrency(totals.totalValue)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} colSpan={isMobile ? 1 : 2} />
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </div>
  );
}