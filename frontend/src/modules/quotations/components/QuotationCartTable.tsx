import { Table, InputNumber, Button, Select } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { DiscountType } from '../types/quotation';
import { formatCurrency } from '../../../core/utils/formatters';
import { useDeviceType } from '../../../core/hooks/useDeviceType';
import type { Product } from '../../products/types/product';
import type { PriceList } from '../../priceLists/types/pricelist';

export interface CartItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  discountType: DiscountType;
  discountValue: number;
  tax: number;
  priceListId?: number;
}

interface Props {
  items: CartItem[];
  onChange: (items: CartItem[]) => void;
  priceMode?: "TAX_INCLUDED" | "TAX_EXCLUDED";
  products: Product[];
  priceLists: PriceList[];
}

// reemplazar computeLine
function computeLine(item: CartItem, priceMode: "TAX_INCLUDED" | "TAX_EXCLUDED" = "TAX_INCLUDED") {
  const discountAmount =
    item.discountType === "PERCENTAGE"
      ? (item.price * item.quantity * item.discountValue) / 100
      : item.discountType === "FIXED"
      ? item.discountValue * item.quantity
      : 0;

  const grossAfterDiscount = item.price * item.quantity - discountAmount;
  const taxRate = item.tax / 100;

  if (priceMode === "TAX_INCLUDED") {
    const lineSubtotal = grossAfterDiscount / (1 + taxRate);
    const taxAmount = grossAfterDiscount - lineSubtotal;
    return { lineSubtotal, taxAmount, lineTotal: grossAfterDiscount };
  } else {
    const lineSubtotal = grossAfterDiscount;
    const taxAmount = lineSubtotal * taxRate;
    return { lineSubtotal, taxAmount, lineTotal: lineSubtotal + taxAmount };
  }
}

export function QuotationCartTable({ items, onChange, priceMode = "TAX_INCLUDED", products, priceLists }: Props) {
  const { isMobile } = useDeviceType();

  const update = (productId: number, patch: Partial<CartItem>) => {
    onChange(
      items.map((i) => (i.productId === productId ? { ...i, ...patch } : i))
    );
  };

  function getAvailableOptions(productId: number) {
    const product = products.find((p) => p.id === productId);
    const ids = new Set(
      product?.prices?.filter((pp) => pp.active).map((pp) => pp.priceListId) ?? []
    );
    return priceLists
      .filter((pl) => pl.active && ids.has(pl.id))
      .map((pl) => ({ value: pl.id, label: pl.name }));
  }

  function handlePriceListChange(productId: number, priceListId: number | undefined) {
    const product = products.find((p) => p.id === productId);
    const customPrice = priceListId
      ? product?.prices?.find((pp) => pp.priceListId === priceListId && pp.active)?.price
      : undefined;
    const resolvedPrice =
      customPrice !== undefined ? Number(customPrice) : Number(product?.price ?? 0);
    update(productId, { priceListId, price: resolvedPrice });
  }

  const remove = (productId: number) => {
    onChange(items.filter((i) => i.productId !== productId));
  };

  const grandTotal = items.reduce((s, i) => s + computeLine(i, priceMode).lineTotal, 0);

  if (isMobile) {
    return (
      <>
        {items.map((row) => (
          <div
            key={row.productId}
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: 8,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{row.productName}</div>
                <div style={{ color: '#888', fontSize: 12 }}>{row.sku}</div>
              </div>
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => remove(row.productId)}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Lista de precios</div>
              <Select
                allowClear
                placeholder="Base"
                style={{ width: '100%' }}
                size="small"
                value={row.priceListId}
                onChange={(v) => handlePriceListChange(row.productId, v ?? undefined)}
                options={getAvailableOptions(row.productId)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Precio</div>
                <InputNumber
                  min={0}
                  value={row.price}
                  onChange={(v) => update(row.productId, { price: v ?? 0 })}
                  style={{ width: '100%' }}
                  prefix="L"
                  size="small"
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Cantidad</div>
                <InputNumber
                  min={1}
                  value={row.quantity}
                  onChange={(v) => update(row.productId, { quantity: v ?? 1 })}
                  style={{ width: '100%' }}
                  size="small"
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Descuento</div>
                <Select
                  value={row.discountType}
                  onChange={(v) => update(row.productId, { discountType: v, discountValue: 0 })}
                  style={{ width: '100%' }}
                  size="small"
                  options={[
                    { value: 'NONE', label: 'Ninguno' },
                    { value: 'PERCENTAGE', label: '%' },
                    { value: 'FIXED', label: 'Fijo' },
                  ]}
                />
              </div>
              {row.discountType !== 'NONE' && (
                <div>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Valor desc.</div>
                  <InputNumber
                    min={0}
                    max={row.discountType === 'PERCENTAGE' ? 100 : undefined}
                    value={row.discountValue}
                    onChange={(v) => update(row.productId, { discountValue: v ?? 0 })}
                    style={{ width: '100%' }}
                    size="small"
                  />
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Imp. %</div>
                <InputNumber
                  min={0}
                  max={100}
                  value={row.tax}
                  onChange={(v) => update(row.productId, { tax: v ?? 0 })}
                  style={{ width: '100%' }}
                  size="small"
                  suffix="%"
                />
              </div>
            </div>

            {(() => {
              const { lineSubtotal, taxAmount, lineTotal } = computeLine(row, priceMode);
              return (
                <div style={{ textAlign: "right", marginTop: 8 }}>
                  {row.tax > 0 && (
                    <div style={{ fontSize: 11, color: "#888" }}>
                      {priceMode === "TAX_INCLUDED" ? "Base" : "Subtotal"}: {formatCurrency(lineSubtotal)}
                      {" · "}ISV: {formatCurrency(taxAmount)}
                    </div>
                  )}
                  <strong style={{ fontWeight: 600 }}>{formatCurrency(lineTotal)}</strong>
                </div>
              );
            })()}
          </div>
        ))}

        {items.length > 0 && (
          <div style={{ textAlign: 'right', fontWeight: 600, marginTop: 4 }}>
            Total: {formatCurrency(grandTotal)}
          </div>
        )}
      </>
    );
  }

  const columns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 100 },
    { title: 'Producto', dataIndex: 'productName', key: 'productName' },
    {
      title: 'Lista de precios',
      key: 'priceList',
      width: 160,
      render: (_: unknown, row: CartItem) => (
        <Select
          allowClear
          placeholder="Base"
          size="small"
          style={{ width: '100%' }}
          value={row.priceListId}
          onChange={(v) => handlePriceListChange(row.productId, v ?? undefined)}
          options={getAvailableOptions(row.productId)}
        />
      ),
    },
    {
      title: 'Precio',
      key: 'price',
      width: 120,
      render: (_: unknown, row: CartItem) => (
        <InputNumber
          min={0}
          value={row.price}
          onChange={(v) => update(row.productId, { price: v ?? 0 })}
          style={{ width: '100%' }}
          prefix="L"
        />
      ),
    },
    {
      title: 'Cant.',
      key: 'quantity',
      width: 90,
      render: (_: unknown, row: CartItem) => (
        <InputNumber
          min={1}
          value={row.quantity}
          onChange={(v) => update(row.productId, { quantity: v ?? 1 })}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Descuento',
      key: 'discount',
      width: 200,
      render: (_: unknown, row: CartItem) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Select
            value={row.discountType}
            onChange={(v) => update(row.productId, { discountType: v, discountValue: 0 })}
            style={{ width: 110 }}
            options={[
              { value: 'NONE', label: 'Ninguno' },
              { value: 'PERCENTAGE', label: '%' },
              { value: 'FIXED', label: 'Fijo' },
            ]}
          />
          {row.discountType !== 'NONE' && (
            <InputNumber
              min={0}
              max={row.discountType === 'PERCENTAGE' ? 100 : undefined}
              value={row.discountValue}
              onChange={(v) => update(row.productId, { discountValue: v ?? 0 })}
              style={{ width: 80 }}
            />
          )}
        </div>
      ),
    },
    {
      title: 'Imp. %',
      key: 'tax',
      width: 90,
      render: (_: unknown, row: CartItem) => (
        <InputNumber
          min={0}
          max={100}
          value={row.tax}
          onChange={(v) => update(row.productId, { tax: v ?? 0 })}
          style={{ width: '100%' }}
          suffix="%"
        />
      ),
    },
    {
      title: 'Total',
      key: 'total',
      width: 130,
      render: (_: unknown, row: CartItem) => {
        const { lineSubtotal, taxAmount, lineTotal } = computeLine(row, priceMode);
        return (
          <div style={{ textAlign: "right" }}>
            {row.tax > 0 && (
              <div style={{ fontSize: 11, color: "#888" }}>
                {priceMode === "TAX_INCLUDED" ? "Base" : "Sub"}: {formatCurrency(lineSubtotal)}
                <br />ISV: {formatCurrency(taxAmount)}
              </div>
            )}
            <strong>{formatCurrency(lineTotal)}</strong>
          </div>
        );
      },
    },
    {
      title: '',
      key: 'remove',
      width: 40,
      render: (_: unknown, row: CartItem) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => remove(row.productId)}
        />
      ),
    },
  ];

  return (
    <>
      <Table
        rowKey="productId"
        columns={columns}
        dataSource={items}
        pagination={false}
        size="small"
        scroll={{ x: true }}
      />
      {items.length > 0 && (
        <div style={{ textAlign: 'right', marginTop: 8, fontWeight: 600 }}>
          Total: {formatCurrency(grandTotal)}
        </div>
      )}
    </>
  );
}