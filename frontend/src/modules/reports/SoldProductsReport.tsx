import { useState } from 'react';
import { Button, Table, Typography } from 'antd';
import { FileExcelOutlined, FilePdfOutlined, ClearOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

import PageHeader from '../../core/components/common/PageHeader';
import ResponsiveRangePicker from '../../core/components/common/ResponsiveRangePicker';
import { useReports } from './useReport';
import type { SoldProductRow } from './report.ts';
import { exportToExcel } from '../../core/utils/exportExcel';
import { exportToPdf } from '../../core/utils/exportPDF';
import { formatCurrency, formatPercent } from '../../core/utils/formatters';
import { useDeviceType } from '../../core/hooks/useDeviceType.ts';

const { Text } = Typography;

export default function SoldProductsReport() {
  const { isMobile } = useDeviceType();
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('day'),
  ]);

  const { soldProducts: data, loading, fetchSoldProducts, clearSoldProducts } = useReports();

  const columns: ColumnsType<SoldProductRow> = isMobile
    ? [
        { title: 'Producto', dataIndex: 'name',        ellipsis: true },
        { title: 'Cant.',    dataIndex: 'quantitySold', width: 60, align: 'right' },
        {
          title: 'Ingresos',
          dataIndex: 'revenue',
          width: 100,
          align: 'right',
          render: (v: number) => formatCurrency(v),
        },
        {
          title: 'Margen',
          dataIndex: 'margin',
          width: 80,
          align: 'right',
          render: (v: number) => (
            <Text type={v >= 0 ? 'success' : 'danger'}>{formatPercent(v)}</Text>
          ),
        },
      ]
    : [
        { title: 'SKU',      dataIndex: 'sku',          width: 110, fixed: 'left' },
        { title: 'Producto', dataIndex: 'name',         width: 110, fixed: 'left' },
        { title: 'Precio',   dataIndex: 'price',        width: 130 },
        { title: 'Cantidad', dataIndex: 'quantitySold', width: 90,  align: 'right' },
        {
          title: 'Ingresos',
          dataIndex: 'revenue',
          width: 120,
          align: 'right',
          render: (v: number) => formatCurrency(v),
          sorter: (a, b) => a.revenue - b.revenue,
        },
        {
          title: 'Costo (COGS)',
          dataIndex: 'cogs',
          width: 120,
          align: 'right',
          render: (v: number) => formatCurrency(v),
        },
        {
          title: 'Utilidad bruta',
          dataIndex: 'grossProfit',
          width: 130,
          align: 'right',
          render: (v: number) => (
            <Text type={v >= 0 ? 'success' : 'danger'}>{formatCurrency(v)}</Text>
          ),
          sorter: (a, b) => a.grossProfit - b.grossProfit,
        },
        {
          title: 'Margen %',
          dataIndex: 'margin',
          width: 100,
          align: 'right',
          render: (v: number) => (
            <Text type={v >= 0 ? 'success' : 'danger'}>{formatPercent(v)}</Text>
          ),
          sorter: (a, b) => a.margin - b.margin,
        },
      ];

  // Totales para el summary
  const totals = data.reduce(
    (acc, r) => ({
      quantitySold:  acc.quantitySold  + r.quantitySold,
      revenue:       acc.revenue       + r.revenue,
      totalDiscount: acc.totalDiscount + r.totalDiscount,
      totalTax:      acc.totalTax      + r.totalTax,
      cogs:          acc.cogs          + r.cogs,
      grossProfit:   acc.grossProfit   + r.grossProfit,
      prices:        acc.prices        + r.price,
    }),
    { quantitySold: 0, revenue: 0, totalDiscount: 0, totalTax: 0, cogs: 0, grossProfit: 0, prices: 0, }
  );
  const globalMargin = totals.revenue > 0
    ? (totals.grossProfit / totals.revenue) * 100
    : 0;

  const handleClear = () => {
    clearSoldProducts();
    setRange([dayjs().startOf('month'), dayjs().endOf('day')]);
  };

  const handleExcelExport = () => {
    exportToExcel(
      data.map(r => ({
        Producto:         r.name,
        Precio:           r.price,
        Cantidad:         r.quantitySold,
        Ingresos:         r.revenue,
        'Costo (COGS)':   r.cogs,
        'Utilidad Bruta': r.grossProfit,
        'Margen %':       r.margin,
      })),
      'Productos Vendidos'
    );
  };

  const handlePdfExport = () => {
    exportToPdf(
      'Reporte de Productos Vendidos',
      [
        { header: 'Producto',       dataKey: 'Producto' },
        { header: 'Cantidad',       dataKey: 'Cantidad' },
        { header: 'Ingresos',       dataKey: 'Ingresos' },
        { header: 'Costo (COGS)',   dataKey: 'Costo (COGS)' },
        { header: 'Utilidad Bruta', dataKey: 'Utilidad Bruta' },
        { header: 'Margen %',       dataKey: 'Margen %' },
      ],
      data.map(r => ({
        Producto:         r.name,
        Precio:           r.price,
        Cantidad:         r.quantitySold,
        Ingresos:         r.revenue,
        'Costo (COGS)':   r.cogs,
        'Utilidad Bruta': r.grossProfit,
        'Margen %':       r.margin,
      })),
      'Reporte de Productos Vendidos'
    );
  };

  return (
    <div>
      <PageHeader title="Productos Vendidos" />

      {/* Filtros */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8, marginBottom: 16 }}>
        <ResponsiveRangePicker
          value={range}
          onChange={(val) => val && setRange(val as [Dayjs, Dayjs])}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            style={isMobile ? { flex: 1 } : undefined}
            onClick={() => fetchSoldProducts({ from: range[0].toISOString(), to: range[1].toISOString() })}
            loading={loading}
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
            disabled={!data.length}
            onClick={handleExcelExport}
          >
            {!isMobile && 'Excel'}
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            disabled={!data.length}
            onClick={handlePdfExport}
          >
            {!isMobile && 'PDF'}
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <Table<SoldProductRow>
        rowKey="productId"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: isMobile ? undefined : 1000 }}
        size="small"
        pagination={{ pageSize: 50, showSizeChanger: !isMobile }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              {isMobile ? (
                <>
                  <Table.Summary.Cell index={0}>
                    <Text strong>TOTAL</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong>{totals.quantitySold}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Text strong>{formatCurrency(totals.revenue)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Text strong type={globalMargin >= 0 ? 'success' : 'danger'}>
                      {formatPercent(globalMargin)}
                    </Text>
                  </Table.Summary.Cell>
                </>
              ) : (
                <>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Text strong>TOTAL</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="left">
                    <Text strong>{formatCurrency(totals.prices)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Text strong>{totals.quantitySold}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Text strong>{formatCurrency(totals.revenue)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <Text strong>{formatCurrency(totals.cogs)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <Text strong type={totals.grossProfit >= 0 ? 'success' : 'danger'}>
                      {formatCurrency(totals.grossProfit)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">
                    <Text strong type={globalMargin >= 0 ? 'success' : 'danger'}>
                      {formatPercent(globalMargin)}
                    </Text>
                  </Table.Summary.Cell>
                </>
              )}
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </div>
  );
}