import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Descriptions, Table, Tag, Spin, Space, Modal, Select, Popconfirm, Dropdown, message, type MenuProps, Alert } from 'antd';
import {
  ArrowLeftOutlined,
  CloseOutlined,
  SwapOutlined,
  PrinterOutlined,
  DownOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { useReportTemplates } from '../../report-templates/hooks/useReportTemplates';
import { useQuotations } from '../hooks/useQuotations';
import { useQuotationDetail } from '../hooks/useQuotations';
import type { QuotationStatus } from '../types/quotation';
import { resolveQuotationTemplate } from '../../report-templates/utils/resolveQuotationTemplate';
import { formatCurrency } from '../../../core/utils/formatters';
import { useDeviceType } from '../../../core/hooks/useDeviceType';
import { exportToPdf } from '../../../core/utils/exportPDF';

const STATUS_COLOR: Record<QuotationStatus, string> = {
  PENDING: 'orange',
  REJECTED: 'red',
  EXPIRED: 'default',
  CONVERTED: 'blue',
};

const STATUS_LABEL: Record<QuotationStatus, string> = {
  PENDING: 'Pendiente',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
  CONVERTED: 'Convertida',
};

const PAYMENT_OPTIONS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CREDIT', label: 'Crédito' },
];

export default function QuotationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();
  const { updateStatus, convertToSale } = useQuotations();
  const { quotation, loading, refresh } = useQuotationDetail(Number(id));
  const { templates, loadingList, getById: getTemplateById, getDefaultByType } = useReportTemplates();

  const [convertOpen, setConvertOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [acting, setActing] = useState(false);

  if (loading) return <Spin style={{ marginTop: 80, display: 'block' }} />;
  if (!quotation) return <p>Cotización no encontrada</p>;

  const currentQuotation = quotation;

  const handlePrint = async (templateId?: number) => {
    let config;
    try {
      if (templateId) {
        const t = await getTemplateById(templateId);
        config = t.config;
      } else {
        const tpl = await getDefaultByType('quotation');
        if (!tpl) { window.print(); return; }
        config = tpl.config;
      }
    } catch {
      message.error('No se pudo cargar la plantilla');
      window.print();
      return;
    }
    const html = resolveQuotationTemplate(config, quotation);
    const win = window.open('', '_blank', 'width=750,height=960');
    if (!win) { message.error('No se pudo abrir la ventana de impresión'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.onafterprint = () => win.close();
  };

  const handleExportPdf = async (templateId?: number) => {
    let config;
    try {
      if (templateId) {
        const t = await getTemplateById(templateId);
        config = t.config;
      } else {
        const tpl = await getDefaultByType('quotation');
        if (!tpl) { exportPdfFallback(); return; }
        config = tpl.config;
      }
    } catch {
      message.error('No se pudo cargar la plantilla');
      exportPdfFallback();
      return;
    }
    const html = resolveQuotationTemplate(config, quotation);
    const win = window.open('', '_blank', 'width=750,height=960');
    if (!win) { message.error('No se pudo abrir la ventana'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  function exportPdfFallback() {
    const rows = currentQuotation.items.map((i: any) => ({
      Producto: i.product.name,
      Cantidad: i.quantity,
      Precio: i.price,
      Total: i.lineTotal,
    }));
    exportToPdf(
      `Cotización ${currentQuotation.quotationNumber}`,
      [
        { header: 'Producto', dataKey: 'Producto' },
        { header: 'Cantidad', dataKey: 'Cantidad' },
        { header: 'Precio',   dataKey: 'Precio'   },
        { header: 'Total',    dataKey: 'Total'    },
      ],
      rows,
      `Cotización ${currentQuotation.quotationNumber}`
    );
  }

function buildTemplateMenuItems(action: 'print' | 'pdf'): MenuProps['items'] {
  if (!templates.length) {
    return [{
      key: 'fallback',
      label: action === 'print' ? 'Imprimir vista actual' : 'PDF genérico',
      onClick: () => action === 'print' ? window.print() : exportPdfFallback(),
    }];
  }
  return [
    {
      key: 'default',
      label: 'Plantilla por defecto',
      onClick: () => action === 'print' ? handlePrint() : handleExportPdf(),
    },
    { type: 'divider' as const },
    ...templates.map((t) => ({
      key: String(t.id),
      label: (
        <span>
          {t.name}
          {t.isDefault && <Tag color="blue" style={{ marginLeft: 6, fontSize: 10 }}>Default</Tag>}
        </span>
      ),
      onClick: () => action === 'print' ? handlePrint(t.id) : handleExportPdf(t.id),
    })),
  ];
}

  const handleStatus = async (status: 'REJECTED') => {
    setActing(true);
    try {
      await updateStatus(quotation.id, status);
      await refresh();
    } finally {
      setActing(false);
    }
  };

  const handleConvert = async () => {
    setActing(true);
    try {
      const sale = await convertToSale(quotation.id, paymentMethod);
      setConvertOpen(false);
      navigate(`/sales/${sale.id}`);
    } finally {
      setActing(false);
    }
  };

  const itemColumns = [
    { title: 'SKU', dataIndex: ['product', 'sku'], key: 'sku' },
    { title: 'Producto', dataIndex: ['product', 'name'], key: 'name' },
    { title: 'Cant.', dataIndex: 'quantity', key: 'quantity' },
    {
      title: 'Precio',
      dataIndex: 'price',
      key: 'price',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Descuento',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      render: (v: number) => (v ? formatCurrency(v) : '—'),
    },
    {
      title: 'Impuesto',
      dataIndex: 'taxAmount',
      key: 'taxAmount',
      render: (v: number) => (v ? formatCurrency(v) : '—'),
    },
    {
      title: 'Total línea',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      render: (v: number) => formatCurrency(v),
    },
  ];

  const mobileColumns = [
    { title: 'Producto', dataIndex: ['product', 'name'], key: 'name' },
    { title: 'Cant.', dataIndex: 'quantity', key: 'quantity', width: 55 },
    {
      title: 'Total',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      render: (v: number) => formatCurrency(v),
    },
  ];

  const expiryWarning = (() => {
    if (quotation.status !== 'PENDING' || !quotation.expiresAt) return null;
    const diff = new Date(quotation.expiresAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return null; // ya expiró, el cron lo marcará
    if (days === 0) return { type: 'error' as const, text: 'Esta cotización vence hoy' };
    if (days <= 5) return { type: 'warning' as const, text: `Esta cotización vence en ${days} día${days > 1 ? 's' : ''}` };
    return null;
  })();

  return (
    <>
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: 8,
        marginBottom: 16,
      }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} block={isMobile}>
          Volver
        </Button>

        <Dropdown menu={{ items: buildTemplateMenuItems('print') }} trigger={['click']}>
          <Button icon={<PrinterOutlined />} loading={loadingList} block={isMobile}>
            Imprimir <DownOutlined style={{ fontSize: 10 }} />
          </Button>
        </Dropdown>

        <Dropdown menu={{ items: buildTemplateMenuItems('pdf') }} trigger={['click']}>
          <Button icon={<FilePdfOutlined />} loading={loadingList} block={isMobile}>
            PDF <DownOutlined style={{ fontSize: 10 }} />
          </Button>
        </Dropdown>

        {quotation.status === 'PENDING' && (
          <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : undefined }}>
            <Button icon={<SwapOutlined />} onClick={() => setConvertOpen(true)} loading={acting} block={isMobile}>
              Convertir a Venta
            </Button>
            <Popconfirm title="¿Rechazar esta cotización?" onConfirm={() => handleStatus('REJECTED')} okText="Sí" cancelText="No">
              <Button danger icon={<CloseOutlined />} loading={acting} block={isMobile}>
                Rechazar
              </Button>
            </Popconfirm>
          </Space>
        )}

        {quotation.convertedSale && (
          <Button type="link" onClick={() => navigate(`/sales/${quotation.convertedSale!.id}`)} block={isMobile}>
            Ver venta {quotation.convertedSale.saleNumber}
          </Button>
        )}
      </div>

      {quotation.status === 'EXPIRED' && (
        <Alert
          type="error"
          message="Esta cotización ha expirado y ya no puede ser convertida a venta"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {expiryWarning && (
        <Alert
          type={expiryWarning.type}
          message={expiryWarning.text}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Descriptions
        title={`Cotización ${quotation.quotationNumber}`}
        bordered
        column={isMobile ? 1 : 2}
        size={isMobile ? 'small' : 'middle'}
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Estado">
          <Tag color={STATUS_COLOR[quotation.status]}>
            {STATUS_LABEL[quotation.status]}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Almacén">{quotation.warehouse.name}</Descriptions.Item>
        <Descriptions.Item label="Cliente">
          {quotation.customer?.name ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Lista de precios">
          {quotation.priceList?.name ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Vendedor">
          {quotation.seller?.name ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Creado por">
          {quotation.user.name}
        </Descriptions.Item>
        <Descriptions.Item label="Fecha">
          {new Date(quotation.createdAt).toLocaleString('es-HN')}
        </Descriptions.Item>
        <Descriptions.Item label="Expira">
          {quotation.expiresAt
            ? new Date(quotation.expiresAt).toLocaleDateString('es-HN')
            : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Observaciones" span={2}>
          {quotation.observations ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Subtotal">
          {formatCurrency(quotation.subtotal)}
        </Descriptions.Item>
        <Descriptions.Item label="Impuestos">
          {formatCurrency(quotation.taxTotal)}
        </Descriptions.Item>
        <Descriptions.Item label="Total" span={2}>
          <strong>{formatCurrency(quotation.total)}</strong>
        </Descriptions.Item>
      </Descriptions>

      <Table
        rowKey="id"
        columns={isMobile ? mobileColumns : itemColumns}
        dataSource={quotation.items}
        pagination={false}
        scroll={{ x: isMobile ? undefined : 700 }}
        size={isMobile ? 'small' : 'middle'}
        expandable={isMobile ? {
          expandedRowRender: (record) => (
            <div style={{ fontSize: 13, lineHeight: '22px' }}>
              <div><b>SKU:</b> {record.product.sku}</div>
              <div><b>Precio:</b> {formatCurrency(record.price)}</div>
              {record.discountAmount ? <div><b>Descuento:</b> {formatCurrency(record.discountAmount)}</div> : null}
              {record.taxAmount ? <div><b>Impuesto:</b> {formatCurrency(record.taxAmount)}</div> : null}
            </div>
          ),
        } : undefined}
      />

      <Modal
        title="Convertir a Venta"
        open={convertOpen}
        onCancel={() => setConvertOpen(false)}
        onOk={handleConvert}
        okText="Confirmar"
        cancelText="Cancelar"
        confirmLoading={acting}
      >
        <p>Selecciona el método de pago para la venta generada:</p>
        <Select
          value={paymentMethod}
          onChange={setPaymentMethod}
          style={{ width: '100%' }}
          options={PAYMENT_OPTIONS}
        />
      </Modal>
    </>
  );
}


