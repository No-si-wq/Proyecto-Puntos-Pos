import { useState } from "react";
import { Button, Table, Typography } from "antd";
import { FileExcelOutlined, FilePdfOutlined, ClearOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";

import PageHeader from "../../core/components/common/PageHeader";
import ResponsiveRangePicker from "../../core/components/common/ResponsiveRangePicker";
import { useReports } from "./useReport";
import type { ProductOutputRow } from "./report";
import { exportToExcel } from "../../core/utils/exportExcel";
import { exportToPdf } from "../../core/utils/exportPDF";
import { formatCurrency } from "../../core/utils/formatters";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../core/hooks/useDeviceType";

const { Text } = Typography;

export default function ProductOutputsReport() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("day"),
  ]);

  const { productOutputs: data, loading, fetchProductOutputs, clearProductOutputs } = useReports();
  const sizes       = useResponsiveSizes();
  const { isMobile } = useDeviceType();

  const totals = data.reduce(
    (acc, r) => ({
      totalQuantity: acc.totalQuantity + r.totalQuantity,
      totalValue:    acc.totalValue    + r.totalValue,
      movementCount: acc.movementCount + r.movementCount,
    }),
    { totalQuantity: 0, totalValue: 0, movementCount: 0 }
  );

  const handleClear = () => {
    clearProductOutputs();
    setRange([dayjs().startOf('month'), dayjs().endOf('day')]);
  };

  const handleSearch = () => {
    fetchProductOutputs({
      from: range[0].toISOString(),
      to:   range[1].toISOString(),
    });
  };

  const handleExcel = () => {
    exportToExcel(
      data.map((r) => ({
        SKU:            r.sku,
        Producto:       r.name,
        Categoría:      r.category,
        "Cant. Salida": r.totalQuantity,
        Valor:          r.totalValue,
        Movimientos:    r.movementCount,
      })),
      "Salida_de_Productos"
    );
  };

  const handlePdf = () => {
    exportToPdf(
      "Reporte de Salida de Productos",
      [
        { header: "SKU",            dataKey: "SKU"            },
        { header: "Producto",       dataKey: "Producto"       },
        { header: "Categoría",      dataKey: "Categoría"      },
        { header: "Cant. Salida",   dataKey: "Cant. Salida"   },
        { header: "Valor",          dataKey: "Valor"          },
        { header: "Movimientos",    dataKey: "Movimientos"    },
      ],
      data.map((r) => ({
        SKU:            r.sku,
        Producto:       r.name,
        Categoría:      r.category,
        "Cant. Salida": r.totalQuantity,
        Valor:          r.totalValue,
        Movimientos:    r.movementCount,
      })),
      "Salida_de_Productos"
    );
  };

  const columns: ColumnsType<ProductOutputRow> = [
    { title: "SKU",      dataIndex: "sku",  width: isMobile ? 80 : 110, fixed: isMobile ? undefined : "left" },
    { title: "Producto", dataIndex: "name", width: isMobile ? 130 : 180, fixed: "left", ellipsis: true },
    ...(!isMobile
      ? [{ title: "Categoría", dataIndex: "category", width: 130 } as const]
      : []),
    {
      title: "Cant. Salida",
      dataIndex: "totalQuantity",
      width: isMobile ? 90 : 130,
      align: "right" as const,
      sorter: (a: ProductOutputRow, b: ProductOutputRow) => a.totalQuantity - b.totalQuantity,
    },
    {
      title: "Valor",
      dataIndex: "totalValue",
      width: isMobile ? 100 : 130,
      align: "right" as const,
      render: (v: number) => formatCurrency(v),
      sorter: (a: ProductOutputRow, b: ProductOutputRow) => a.totalValue - b.totalValue,
    },
    ...(!isMobile
      ? [{
          title: "Movimientos",
          dataIndex: "movementCount",
          width: 110,
          align: "right" as const,
        }]
      : []),
  ];

  return (
    <div>
      <PageHeader title="Salida de Productos" />

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8, marginBottom: 16 }}>
        <ResponsiveRangePicker
          value={range}
          onChange={(val) => val && setRange(val as [Dayjs, Dayjs])}
          size={sizes.input}
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
            onClick={handleClear}
            disabled={!data.length}
            style={isMobile ? { flex: 1 } : undefined}
          >
            Limpiar
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
      </div>

      <Table<ProductOutputRow>
        rowKey="productId"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: isMobile ? 400 : 800 }}
        size={isMobile ? "small" : "middle"}
        pagination={{ pageSize: 50, showSizeChanger: !isMobile, simple: isMobile }}
        locale={{ emptyText: "Selecciona un rango de fechas para consultar" }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={isMobile ? 2 : 3}>
                <Text strong>TOTAL</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong>{totals.totalQuantity}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <Text strong>{formatCurrency(totals.totalValue)}</Text>
              </Table.Summary.Cell>
              {!isMobile && (
                <Table.Summary.Cell index={3} align="right">
                  <Text strong>{totals.movementCount}</Text>
                </Table.Summary.Cell>
              )}
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </div>
  );
}