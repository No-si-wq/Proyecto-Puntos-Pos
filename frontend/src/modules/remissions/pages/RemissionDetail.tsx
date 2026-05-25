import { useParams, useNavigate } from 'react-router-dom';
import { Button, Descriptions, Table, Tag, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useRemissionDetail } from '../hooks/useRemissions';
import type { RemissionStatus } from '../types/remission';
import { useDeviceType } from '../../../core/hooks/useDeviceType';

const STATUS_COLOR: Record<RemissionStatus, string> = {
  PENDING: 'orange', DELIVERED: 'green', CANCELLED: 'red',
};
const STATUS_LABEL: Record<RemissionStatus, string> = {
  PENDING: 'Pendiente', DELIVERED: 'Entregada', CANCELLED: 'Cancelada',
};

export default function RemissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { remission, loading } = useRemissionDetail(Number(id));
  const { isMobile } = useDeviceType();

  if (loading) return <Spin style={{ marginTop: 80, display: 'block' }} />;
  if (!remission) return <p>Remisión no encontrada</p>;

  const columns = [
    { title: 'SKU', dataIndex: ['product', 'sku'], key: 'sku' },
    { title: 'Producto', dataIndex: ['product', 'name'], key: 'name' },
    { title: 'Cantidad', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Nota', dataIndex: 'note', key: 'note', render: (v?: string) => v ?? '—' },
  ];

  /* ── Vista móvil ─────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div style={{ padding: '0 4px 32px' }}>
        {/* Botón volver */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
          size="small"
        >
          Volver
        </Button>

        {/* Encabezado */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>
              {remission.remissionNumber}
            </span>
            <Tag color={STATUS_COLOR[remission.status]} style={{ margin: 0 }}>
              {STATUS_LABEL[remission.status]}
            </Tag>
          </div>
        </div>

        {/* Tarjeta de info general */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #f0f0f0',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginBottom: 20,
          }}
        >
          <InfoRow label="Almacén" value={remission.warehouse.name} />
          <InfoRow label="Cliente" value={remission.customerName ?? '—'} />
          <InfoRow
            label="Creado por"
            value={remission.user.name ?? remission.user.username}
          />
          <InfoRow
            label="Fecha"
            value={new Date(remission.createdAt).toLocaleString('es-HN')}
          />
          {remission.note && (
            <div style={{ paddingTop: 6, borderTop: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Nota</div>
              <div style={{ fontSize: 13 }}>{remission.note}</div>
            </div>
          )}
        </div>

        {/* Lista de productos */}
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
          Productos ({remission.items.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {remission.items.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#fff',
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                {item.product.name}
              </div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
                SKU: {item.product.sku}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#555' }}>Cantidad: <strong>{item.quantity}</strong></span>
                {item.note && (
                  <span style={{ color: '#888', fontStyle: 'italic' }}>{item.note}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Vista desktop ───────────────────────────────────────── */
  return (
    <>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        Volver
      </Button>

      <Descriptions title={`Remisión ${remission.remissionNumber}`} bordered column={2}>
        <Descriptions.Item label="Estado">
          <Tag color={STATUS_COLOR[remission.status]}>{STATUS_LABEL[remission.status]}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Almacén">{remission.warehouse.name}</Descriptions.Item>
        <Descriptions.Item label="Cliente">{remission.customerName ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Creado por">
          {remission.user.name ?? remission.user.username}
        </Descriptions.Item>
        <Descriptions.Item label="Fecha">
          {new Date(remission.createdAt).toLocaleString('es-HN')}
        </Descriptions.Item>
        <Descriptions.Item label="Nota" span={2}>{remission.note ?? '—'}</Descriptions.Item>
      </Descriptions>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={remission.items}
        pagination={false}
        style={{ marginTop: 24 }}
      />
    </>
  );
}

/* ── Componente auxiliar ────────────────────────────────────── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: '#888', flexShrink: 0, marginRight: 8 }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  );
}