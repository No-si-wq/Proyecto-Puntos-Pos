import { useState } from 'react';
import {
  Button, Modal, Form, Select, Input, Row, Col, AutoComplete,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PageHeader from '../../../core/components/common/PageHeader';
import { RemissionsTable } from '../components/RemissionsTable';
import { RemissionCartTable, type CartItem } from '../components/RemissionCartTable';
import { useRemissions } from '../hooks/useRemissions';
import { useWarehouses } from '../../warehouses/hooks/useWarehouse';
import { useProducts } from '../../products/hooks/useProducts';
import { useDeviceType } from '../../../core/hooks/useDeviceType';

export default function Remissions() {
  const { remissions, loading, create, cancel, deliver } = useRemissions();
  const { warehouses } = useWarehouses();
  const { products } = useProducts();
  const { isMobile } = useDeviceType();

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const productOptions = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase())
    )
    .map((p) => ({ value: p.id, label: `${p.sku} – ${p.name}` }));

  const addToCart = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (cart.some((i) => i.productId === productId)) return;
    setCart((prev) => [
      ...prev,
      { productId, productName: product.name, sku: product.sku, quantity: 1 },
    ]);
    setProductSearch('');
  };

  const handleCreate = async () => {
    const values = await form.validateFields();
    if (cart.length === 0) return;
    await create({
      warehouseId: values.warehouseId,
      customerName: values.customerName ?? undefined,
      note: values.note,
      items: cart.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        note: i.note,
      })),
    });
    setOpen(false);
    form.resetFields();
    setCart([]);
  };

  return (
    <>
      <PageHeader
        title="Remisiones"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Nueva Remisión
          </Button>
        }
      />

      <div style={{ marginTop: 16 }}>
        <RemissionsTable
          data={remissions}
          loading={loading}
          onCancel={cancel}
          onDeliver={deliver}
        />
      </div>

      <Modal
        title="Nueva Remisión"
        open={open}
        onCancel={() => { setOpen(false); setCart([]); form.resetFields(); }}
        onOk={handleCreate}
        okText="Crear"
        cancelText="Cancelar"
        width={isMobile ? '100%' : 800}
        style={isMobile ? { top: 0, margin: 0, padding: 0, maxWidth: '100vw' } : undefined}
        styles={isMobile ? { body: { padding: '12px 16px' } } : undefined}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="warehouseId"
                label="Almacén de salida"
                rules={[{ required: true, message: 'Selecciona un almacén' }]}
              >
                <Select placeholder="Seleccionar almacén">
                  {warehouses.map((w) => (
                    <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="customerName" label="Cliente (opcional)">
                <Input placeholder="Nombre del cliente..." allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Nota general">
            <Input.TextArea rows={2} placeholder="Observaciones de la remisión..." />
          </Form.Item>

          <Form.Item label="Agregar producto">
            <AutoComplete
              options={productOptions}
              value={productSearch}
              onChange={setProductSearch}
              onSelect={(val) => addToCart(Number(val))}
              placeholder="Buscar por nombre o SKU..."
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>

        <RemissionCartTable items={cart} onChange={setCart} />
      </Modal>
    </>
  );
}