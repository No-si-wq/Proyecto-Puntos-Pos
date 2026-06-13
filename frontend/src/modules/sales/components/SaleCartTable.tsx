import { InputNumber, Select, Input } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { formatCurrency } from "../../../core/utils/formatters";
import type { SaleCartItem } from "../types/saleCart.store";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import type { PriceList } from "../../priceLists/types/pricelist";
import type { Product } from "../../products/types/product";
import { usePermissions } from "../../../core/hooks/usePermissions";

interface Props {
  items: SaleCartItem[];
  onQuantityChange: (id: number, q: number) => void;
  onRemove: (id: number) => void;
  onDiscountChange: (
    id: number,
    type: "NONE" | "PERCENTAGE" | "FIXED",
    value: number
  ) => void;
  onPriceListChange: (
    productId: number,
    priceListId: number | undefined,
    resolvedPrice: number
  ) => void;
  onObservationsChange: (productId: number, value: string) => void;
  onPriceChange: (productId: number, price: number) => void;
  priceLists: PriceList[];
  products: Product[];
}

export function SaleCartTable({
  items,
  onQuantityChange,
  onRemove,
  onDiscountChange,
  onPriceListChange,
  onObservationsChange,
  onPriceChange,
  priceLists,
  products,
}: Props) {
  const { isMobile } = useDeviceType();
  const { isAdmin } = usePermissions();

  function getAvailableOptions(productId: number) {
    const product = products.find((p) => p.id === productId);
    const ids = new Set(
      product?.prices?.filter((pp) => pp.active).map((pp) => pp.priceListId) ?? []
    );
    return priceLists
      .filter((pl) => pl.active && ids.has(pl.id))
      .map((pl) => ({ value: pl.id, label: pl.name }));
  }

  function handlePriceListChange(item: SaleCartItem, v: number | undefined) {
    const product = products.find((p) => p.id === item.productId);
    const customPrice = v
      ? product?.prices?.find((pp) => pp.priceListId === v)?.price
      : undefined;
    const resolvedPrice =
      customPrice !== undefined
        ? Number(customPrice)
        : Number(product?.price ?? item.price);
    onPriceListChange(item.productId, v, resolvedPrice);
  }

  if (isMobile) {
    return (
      <div>
        {items.length === 0 && (
          <div style={{ textAlign: "center", color: "#bbb", padding: "32px 0", fontSize: 14 }}>
            Sin productos en el carrito
          </div>
        )}
        {items.map((i) => {
          const taxPercent = (i.tax * 100).toFixed(0);
          return (
            <div
              key={i.productId}
              style={{ borderRadius: 10, border: "1px solid #e8e8e8", background: "#fff", marginBottom: 10, overflow: "hidden" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px 8px", borderBottom: "1px solid #f5f5f5", background: "#fafafa" }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{i.name}</span>
                <button style={removeBtnStyle} onClick={() => onRemove(i.productId)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ff4d4f"; (e.currentTarget as HTMLButtonElement).style.background = "#fff1f0"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ccc"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <DeleteOutlined style={{ fontSize: 14 }} />
                </button>
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ marginBottom: 10 }}>
                  <span style={mobileLabelStyle}>Lista de precios</span>
                  <Select allowClear placeholder="Base" style={{ width: "100%" }} size="small"
                    value={i.priceListId ?? undefined}
                    onChange={(v) => handlePriceListChange(i, v ?? undefined)}
                    options={getAvailableOptions(i.productId)}
                  />
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <span style={mobileLabelStyle}>Cantidad</span>
                    <InputNumber min={1} size="small" style={{ width: "100%" }} value={i.quantity}
                      onChange={(v) => onQuantityChange(i.productId, Number(v ?? 1))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={mobileLabelStyle}>Precio unit.</span>
                    {isAdmin ? (
                      <InputNumber
                        min={0}
                        size="small"
                        style={{ width: "100%" }}
                        value={i.price}
                        formatter={(v) => `L ${v}`}
                        parser={(v) => Number(v?.replace(/L\s?/, "") ?? "0")}
                        onChange={(v) => onPriceChange(i.productId, Number(v ?? 0))}
                      />
                    ) : (
                      <div style={{ paddingTop: 5, fontWeight: 500, fontSize: 14 }}>{formatCurrency(i.price)}</div>
                    )}
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={mobileLabelStyle}>Descuento</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Select value={i.discountType} size="small" style={{ width: 110 }}
                      onChange={(type) => onDiscountChange(i.productId, type, i.discountValue)}
                      options={[{ value: "NONE", label: "Ninguno" }, { value: "PERCENTAGE", label: "%" }, { value: "FIXED", label: "Monto" }]}
                    />
                    <InputNumber min={0} size="small" style={{ flex: 1 }} value={i.discountValue}
                      disabled={i.discountType === "NONE"}
                      onChange={(v) => onDiscountChange(i.productId, i.discountType, Number(v ?? 0))} />
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={mobileLabelStyle}>Observaciones</span>
                  <Input
                    size="small"
                    maxLength={500}
                    placeholder="Nota del ítem (opcional)"
                    value={i.observations}
                    onChange={(e) => onObservationsChange(i.productId, e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid #f0f0f0", paddingTop: 10, marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    <div>
                      ISV <span style={taxBadgeStyle}>{taxPercent}%</span>{" "}
                      {formatCurrency(i.taxAmount)}
                    </div>
                    {i.discountAmount > 0 && (
                      <div style={{ color: "#ff4d4f", marginTop: 2 }}>−{formatCurrency(i.discountAmount)}</div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#999", marginBottom: 1 }}>
                      {i.priceMode === "TAX_INCLUDED" ? "Base" : "Subtotal"}
                    </div>
                    <strong style={{ fontSize: 16 }}>
                      {formatCurrency(i.lineSubtotal)}
                    </strong>
                    {i.tax > 0 && (
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                        Total: {formatCurrency(i.lineTotal)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 10, border: "1px solid #e8e8e8", background: "#fff", overflowX: "auto" }}>
      <table style={{ width: "100%", minWidth: 807, borderCollapse: "collapse" }}>
        <colgroup>
          <col style={{ minWidth: 160 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 76 }} />
          <col style={{ width: 112 }} />
          <col style={{ width: 185 }} />
          <col style={{ width: 106 }} />
          <col style={{ width: 160 }} />
          <col style={{ width: 38 }} />
        </colgroup>

        <thead style={{ background: "#fafafa" }}>
          <tr>
            {([
              { label: "Producto",  align: "left"   },
              { label: "Lista",     align: "left"   },
              { label: "Cant.",     align: "center" },
              { label: "Precio",    align: "right"  },
              { label: "Descuento", align: "left"   },
              { label: "Subtotal",  align: "right"  },
              { label: "Obs.",         align: "left"   },
              { label: "",          align: "center" },
            ] as { label: string; align: React.CSSProperties["textAlign"] }[]).map(({ label, align }, idx) => (
              <th key={idx} style={{ ...thStyle, textAlign: align }}>{label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", color: "#bbb", padding: "40px 0", fontSize: 14 }}>
                Sin productos en el carrito
              </td>
            </tr>
          )}

          {items.map((i, idx) => {
            const taxPercent = (i.tax * 100).toFixed(0);
            const isLast     = idx === items.length - 1;
            const td = (extra?: React.CSSProperties): React.CSSProperties => ({
              padding: "10px 10px",
              verticalAlign: "middle",
              borderBottom: isLast ? "none" : "1px solid #f5f5f5",
              ...extra,
            });

            return (
              <tr
                key={i.productId}
                style={{ transition: "background 0.12s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "#fafafa")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
              >
                <td style={td()}>
                  <div
                    style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={i.name}
                  >
                    {i.name}
                  </div>
                </td>

                <td style={td()}>
                  <Select
                    allowClear
                    placeholder="Base"
                    size="small"
                    style={{ width: "100%" }}
                    value={i.priceListId ?? undefined}
                    onChange={(v) => handlePriceListChange(i, v ?? undefined)}
                    options={getAvailableOptions(i.productId)}
                  />
                </td>

                <td style={td({ textAlign: "center" })}>
                  <InputNumber
                    min={1}
                    size="small"
                    controls
                    style={{ width: "100%" }}
                    value={i.quantity}
                    onChange={(v) => onQuantityChange(i.productId, Number(v ?? 1))}
                  />
                </td>

                <td style={td({ textAlign: "right" })}>
                  {isAdmin ? (
                    <InputNumber
                      min={0}
                      size="small"
                      style={{ width: "100%" }}
                      value={i.price}
                      formatter={(v) => `L ${v}`}
                      parser={(v) => Number(v?.replace(/L\s?/, "") ?? "0")}
                      onChange={(v) => onPriceChange(i.productId, Number(v ?? 0))}
                    />
                  ) : (
                    <div style={{ fontWeight: 500, fontSize: 13, color: "#1a1a1a", fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(i.price)}
                    </div>
                  )}
                  {i.tax > 0 && (
                    <div style={{ marginTop: 3, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 3 }}>
                      <span style={taxBadgeStyle}>{taxPercent}%</span>
                      <span style={{ fontSize: 11, color: "#aaa", fontVariantNumeric: "tabular-nums" }}>
                        {formatCurrency(i.taxAmount)}
                      </span>
                    </div>
                  )}
                </td>

                <td style={td()}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <Select
                      value={i.discountType}
                      size="small"
                      style={{ width: 88 }}
                      onChange={(type) => onDiscountChange(i.productId, type, i.discountValue)}
                      options={[
                        { value: "NONE",       label: "Ninguno" },
                        { value: "PERCENTAGE", label: "%"       },
                        { value: "FIXED",      label: "Monto"   },
                      ]}
                    />
                    <InputNumber
                      min={0}
                      size="small"
                      style={{ flex: 1 }}
                      value={i.discountValue}
                      disabled={i.discountType === "NONE"}
                      onChange={(v) => onDiscountChange(i.productId, i.discountType, Number(v ?? 0))}
                    />
                  </div>
                </td>

                <td style={td({ textAlign: "right" })}>
                  {i.discountAmount > 0 && (  
                    <div style={{ fontSize: 11, color: "#ff4d4f", fontVariantNumeric: "tabular-nums", marginBottom: 1 }}>
                      −{formatCurrency(i.discountAmount)}
                    </div>
                  )}
                  {/* Base sin impuesto */}
                  <strong style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrency(i.lineTotal)}
                  </strong>
                </td>

                <td style={td()}>
                  <Input
                    size="small"
                    maxLength={500}
                    placeholder="Nota…"
                    value={i.observations}
                    onChange={(e) => onObservationsChange(i.productId, e.target.value)}
                  />
                </td>

                <td style={td({ textAlign: "center" })}>
                  <button
                    style={removeBtnStyle}
                    onClick={() => onRemove(i.productId)}
                    title="Quitar"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ff4d4f"; (e.currentTarget as HTMLButtonElement).style.background = "#fff1f0"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ccc"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <DeleteOutlined style={{ fontSize: 13 }} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: 10,
  fontWeight: 700,
  color: "#aaa",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  borderBottom: "1px solid #f0f0f0",
  whiteSpace: "nowrap",
};

const taxBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#f0f7ff",
  color: "#1677ff",
  fontSize: 10,
  fontWeight: 700,
  padding: "1px 6px",
  borderRadius: 20,
  letterSpacing: "0.02em",
};

const removeBtnStyle: React.CSSProperties = {
  color: "#ccc",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: "4px 5px",
  borderRadius: 6,
  transition: "color 0.15s, background 0.15s",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const mobileLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#999",
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: 4,
};