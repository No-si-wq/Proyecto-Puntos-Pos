import { useState } from 'react';
import {
  Button, Modal, Form, Select, Input, Row, Col,
  AutoComplete, DatePicker, Space, Dropdown, type MenuProps
} from 'antd';
import { PlusOutlined, FileExcelOutlined, MoreOutlined } from '@ant-design/icons';
import PageHeader from '../../../core/components/common/PageHeader';
import { QuotationsTable } from '../components/QuotationsTable';
import { QuotationCartTable, type CartItem } from '../components/QuotationCartTable';
import { useQuotations } from '../hooks/useQuotations';
import { useWarehouses } from '../../warehouses/hooks/useWarehouse';
import { useCustomers } from '../../customers/useCustomers';
import { useProducts } from '../../products/hooks/useProducts';
import { usePriceLists } from '../../priceLists/hooks/usePriceList';
import { useDeviceType } from '../../../core/hooks/useDeviceType';
import { exportToExcel } from '../../../core/utils/exportExcel';
import { useResponsiveSizes } from '../../../core/hooks/useResponsiveSizes';
import { useSettings } from '../../settings/hooks/useSettings';
import dayjs from 'dayjs';

export default function Quotations() {
  const { quotations, loading, create } = useQuotations();
  const { priceMode } = useSettings();
  const { isMobile } = useDeviceType();
  const { warehouses } = useWarehouses();
  const { customers } = useCustomers();
  const { products } = useProducts();
  const { priceLists } = usePriceLists();
  const sizes = useResponsiveSizes();

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const statusLabel: Record<string, string> = {
    PENDING: "Pendiente",
    REJECTED: "Rechazada",
    EXPIRED: "Expirada",
    CONVERTED: "Convertida",
  };

  function handleExportExcel() {
    const rows = quotations.map((q) => ({
      "N° Cotización": q.quotationNumber,
      Estado: statusLabel[q.status] ?? q.status,
      Fecha: dayjs(q.createdAt).format("DD/MM/YYYY HH:mm"),
      Expira: q.expiresAt ? dayjs(q.expiresAt).format("DD/MM/YYYY") : "",
      Cliente: q.customer?.name ?? "Sin cliente",
      Almacén: q.warehouse.name,
      "Lista de precios": q.priceList?.name ?? "Base",
      Vendedor: q.seller?.name ?? q.user.name,
      Subtotal: Number(q.subtotal),
      Descuento: Number(q.discount),
      Impuestos: Number(q.taxTotal),
      Total: Number(q.total),
      Observaciones: q.observations ?? "",
    }));

    exportToExcel(rows, "Cotizaciones");
  }

  const productOptions = products
    .filter(
      (p) =>
        p.active &&
        (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.sku.toLowerCase().includes(productSearch.toLowerCase()))
    )
    .map((p) => ({ value: String(p.id), label: `${p.sku} – ${p.name}` }));

  const addToCart = (val: string) => {
    const product = products.find((p) => p.id === Number(val));
    if (!product) return;
    if (cart.some((i) => i.productId === product.id)) {
      setCart((prev) =>
        prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
      setProductSearch('');
      return;
    }
    const priceListId: number | undefined = form.getFieldValue('priceListId');
    const customPrice = priceListId
      ? product.prices?.find((pp) => pp.priceListId === priceListId && pp.active)?.price
      : undefined;
    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        price: customPrice !== undefined ? Number(customPrice) : Number(product.price),
        discountType: 'NONE',
        discountValue: 0,
        tax: Number(product.tax ?? 0) * 100,
      },
    ]);
    setProductSearch('');
  };

  const handleClose = () => {
    setOpen(false);
    form.resetFields();
    setCart([]);
  };

  const handlePriceListChange = (priceListId: number | undefined) => {
    setCart((prev) =>
      prev.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return item;
        const customPrice = priceListId
          ? product.prices?.find((pp) => pp.priceListId === priceListId && pp.active)?.price
          : undefined;
        return {
          ...item,
          price: customPrice !== undefined ? Number(customPrice) : Number(product.price),
        };
      })
    );
  };

  const toolsMenu: MenuProps = {
    items: [
      { key: "excel", label: "Exportar Excel", icon: <FileExcelOutlined />, onClick: handleExportExcel },
    ],
  };

  const handleCreate = async () => {
    const values = await form.validateFields();
    if (cart.length === 0) return;
    setSaving(true);
    try {
      await create({
        customerId: values.customerId,
        warehouseId: values.warehouseId,
        priceListId: values.priceListId,
        sellerId: values.sellerId,
        observations: values.observations,
        expiresAt: values.expiresAt?.endOf('day').toISOString(),
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
          discountType: i.discountType,
          discountValue: i.discountValue,
          tax: i.tax,
        })),
      });
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  const filteredQuotations = filterCustomerId
    ? quotations.filter((q) => q.customerId === filterCustomerId)
    : quotations;

  return (
    <>
      <PageHeader
        title="Cotizaciones"
        extra={
          isMobile ? (
            <Space size={6}>
              <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => setOpen(true)}>
                Nueva
              </Button>
              <Dropdown menu={toolsMenu} trigger={["click"]} placement="bottomRight">
                <Button icon={<MoreOutlined />} size="small" />
              </Dropdown>
            </Space>
          ) : (
            <Space wrap>
              <Button icon={<FileExcelOutlined />} size={sizes.button} onClick={handleExportExcel}>
                Exportar Excel
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
                Nueva Cotización
              </Button>
            </Space>
          )
        }
      />

      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 12, maxWidth: isMobile ? '100%' : 300 }}>
          <Select
            placeholder="Filtrar por cliente"
            allowClear
            showSearch
            optionFilterProp="children"
            style={{ width: '100%' }}
            value={filterCustomerId}
            onChange={(val) => setFilterCustomerId(val)}
          >
            {customers.map((c) => (
              <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
            ))}
          </Select>
        </div>
        <QuotationsTable data={filteredQuotations} loading={loading} />
      </div>

      <Modal
        title="Nueva Cotización"
        open={open}
        onCancel={handleClose}
        onOk={handleCreate}
        okText="Crear"
        cancelText="Cancelar"
        confirmLoading={saving}
        width={isMobile ? '100%' : 900}
        style={isMobile ? { top: 0, margin: 0, padding: 0, maxWidth: '100vw' } : undefined}
        styles={isMobile ? { body: { padding: '12px 16px' } } : undefined}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="warehouseId"
                label="Almacén"
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
              <Form.Item name="customerId" label="Cliente (opcional)">
                <Select placeholder="Sin cliente" allowClear showSearch optionFilterProp="children">
                  {customers.map((c) => (
                    <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}> 
              <Form.Item name="priceListId" label="Lista de precios">
                <Select 
                  placeholder="Precio base" 
                  allowClear 
                  onChange={handlePriceListChange}
                >
                  {priceLists.map((pl) => (
                    <Select.Option key={pl.id} value={pl.id}>{pl.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="expiresAt" label="Fecha de expiración">
                <DatePicker
                  style={{ width: '100%' }} 
                  disabledDate={(current) => current && current.isBefore(dayjs().startOf('day'))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="observations" label="Observaciones">
            <Input.TextArea rows={2} placeholder="Observaciones o condiciones de la cotización..." />
          </Form.Item>

          <Form.Item label="Agregar producto">
            <AutoComplete
              options={productOptions}
              value={productSearch}
              onChange={setProductSearch}
              onSelect={addToCart}
              placeholder="Buscar por nombre o SKU..."
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>

        <QuotationCartTable items={cart} onChange={setCart} priceMode={priceMode} />
      </Modal>
    </>
  );
}