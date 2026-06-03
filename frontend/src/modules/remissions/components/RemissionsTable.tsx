import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import type { Remission, RemissionStatus } from '../types/remission';
import { useNavigate } from 'react-router-dom';
import { useDeviceType } from '../../../core/hooks/useDeviceType';

const STATUS_COLOR: Record<RemissionStatus, string> = {
  PENDING: 'orange',
  DELIVERED: 'green',
  CANCELLED: 'red',
};
const STATUS_LABEL: Record<RemissionStatus, string> = {
  PENDING: 'Pendiente',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
};

interface Props {
  data: Remission[];
  loading: boolean;
  onCancel: (id: number) => void;
  onDeliver: (id: number) => void;
}

export function RemissionsTable({ data, loading, onCancel, onDeliver }: Props) {
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((record) => (
          <div
            key={record.id}
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: '10px 12px',
              background: '#fff',
            }}
          >
            {/* Encabezado: número + estado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{record.remissionNumber}</span>
              <Tag color={STATUS_COLOR[record.status]}>{STATUS_LABEL[record.status]}</Tag>
            </div>

            {/* Detalles */}
            <div style={{ fontSize: 12, color: '#555', display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
              <span>{record.warehouse?.name ?? '—'}</span>
              <span>{record.customerName ?? 'Sin cliente'}</span>
              <span>{record._count?.items ?? '—'} producto(s)</span>
              <span>{new Date(record.createdAt).toLocaleDateString('es-HN')}</span>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/remissions/${record.id}`)}
              >
                Ver
              </Button>
              {record.status === 'PENDING' && (
                <>
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => onDeliver(record.id)}
                  >
                    Entregar
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => onCancel(record.id)}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
        {!loading && data.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: '#aaa' }}>Sin remisiones</div>
        )}
      </div>
    );
  }

  const columns = [
    { title: 'Número', dataIndex: 'remissionNumber', key: 'remissionNumber' },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (s: RemissionStatus) => (
        <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>
      ),
    },
    {
      title: 'Almacén',
      dataIndex: 'warehouse',
      key: 'warehouse',
      render: (w: { name: string }) => w.name,
    },
    {
      title: 'Cliente',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (v?: string) => v ?? '—',
    },
    {
      title: 'Productos',
      dataIndex: '_count',
      key: '_count',
      render: (c?: { items: number }) => c?.items ?? '—',
    },
    {
      title: 'Creada',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleDateString('es-HN'),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: unknown, record: Remission) => (
        <Space>
          <Tooltip title="Ver detalle">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/remissions/${record.id}`)}
            />
          </Tooltip>
          {record.status === 'PENDING' && (
            <>
              <Tooltip title="Marcar entregada">
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => onDeliver(record.id)}
                />
              </Tooltip>
              <Tooltip title="Cancelar">
                <Button
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => onCancel(record.id)}
                />
              </Tooltip>
            </>
          )}
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
      pagination={{ pageSize: 10 }}
      scroll={{ x: true }}
    />
  );
}