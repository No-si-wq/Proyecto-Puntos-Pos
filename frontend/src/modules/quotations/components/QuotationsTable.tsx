import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Quotation, QuotationStatus } from '../types/quotation';
import { formatCurrency } from '../../../core/utils/formatters';
import { useDeviceType } from '../../../core/hooks/useDeviceType';

const STATUS_COLOR: Record<QuotationStatus, string> = {
  PENDING: 'orange',
  ACCEPTED: 'green',
  REJECTED: 'red',
  EXPIRED: 'default',
  CONVERTED: 'blue',
};

const STATUS_LABEL: Record<QuotationStatus, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
  CONVERTED: 'Convertida',
};

interface Props {
  data: Quotation[];
  loading: boolean;
}

export function QuotationsTable({ data, loading }: Props) {
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();

  const columns = [
    {
      title: 'N°',
      dataIndex: 'quotationNumber',
      key: 'quotationNumber',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (s: QuotationStatus) => (
        <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>
      ),
    },
    ...(!isMobile
      ? [
          {
            title: 'Cliente',
            dataIndex: ['customer', 'name'],
            key: 'customer',
            render: (v?: string) => v ?? '—',
          },
          {
            title: 'Almacén',
            dataIndex: ['warehouse', 'name'],
            key: 'warehouse',
          },
        ]
      : []),
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (v: number) => formatCurrency(v),
    },
    ...(!isMobile
      ? [
          {
            title: 'Expira',
            dataIndex: 'expiresAt',
            key: 'expiresAt',
            render: (v?: string) =>
              v ? new Date(v).toLocaleDateString('es-HN') : '—',
          },
          {
            title: 'Fecha',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (v: string) => new Date(v).toLocaleDateString('es-HN'),
          },
        ]
      : []),
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: unknown, record: Quotation) => (
        <Space>
          <Tooltip title="Ver detalle">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/quotations/${record.id}`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{ pageSize: 20 }}
      scroll={{ x: true }}
      size={isMobile ? 'small' : 'middle'}
    />
  );
}