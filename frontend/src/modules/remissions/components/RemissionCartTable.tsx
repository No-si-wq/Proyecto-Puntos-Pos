import { InputNumber, Button, Input, Empty } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { Table } from 'antd';
import { useDeviceType } from '../../../core/hooks/useDeviceType';

export interface CartItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  note?: string;
}

interface Props {
  items: CartItem[];
  onChange: (items: CartItem[]) => void;
}

export function RemissionCartTable({ items, onChange }: Props) {
  const { isMobile } = useDeviceType();

  const update = (index: number, field: keyof CartItem, value: unknown) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  if (isMobile) {
    if (items.length === 0) {
      return <Empty description="Agrega productos al carrito" />;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, index) => (
          <div
            key={item.productId}
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: '10px 12px',
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {/* Header: nombre + botón eliminar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.productName}</div>
                <div style={{ fontSize: 11, color: '#888' }}>SKU: {item.sku}</div>
              </div>
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => remove(index)}
              />
            </div>

            {/* Cantidad + Nota en fila */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: '0 0 auto' }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Cantidad</div>
                <InputNumber
                  min={1}
                  value={item.quantity}
                  onChange={(v) => update(index, 'quantity', v ?? 1)}
                  style={{ width: 80 }}
                  size="small"
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Nota</div>
                <Input
                  value={item.note}
                  onChange={(e) => update(index, 'note', e.target.value)}
                  placeholder="Opcional"
                  size="small"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const columns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 110 },
    { title: 'Producto', dataIndex: 'productName', key: 'productName' },
    {
      title: 'Cantidad',
      key: 'quantity',
      width: 120,
      render: (_: unknown, _record: CartItem, index: number) => (
        <InputNumber
          min={1}
          value={items[index].quantity}
          onChange={(v) => update(index, 'quantity', v ?? 1)}
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: 'Nota',
      key: 'note',
      render: (_: unknown, _record: CartItem, index: number) => (
        <Input
          value={items[index].note}
          onChange={(e) => update(index, 'note', e.target.value)}
          placeholder="Opcional"
        />
      ),
    },
    {
      title: '',
      key: 'remove',
      width: 50,
      render: (_: unknown, _record: CartItem, index: number) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => remove(index)}
        />
      ),
    },
  ];

  return (
    <Table
      rowKey="productId"
      columns={columns}
      dataSource={items}
      pagination={false}
      size="small"
      locale={{ emptyText: 'Agrega productos al carrito' }}
    />
  );
}