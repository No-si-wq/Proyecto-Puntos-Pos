import type { ReportTemplateConfig, DetailColumn } from "../types/report-template";
import { formatCurrency } from "../../../core/utils/formatters";

// Usa la misma forma que QuotationDetail espera
interface QuotationItem {
  id: number;
  product: { sku: string; name: string };
  quantity: number;
  price: number;
  discountAmount: number;
  taxAmount: number;
  lineSubtotal: number;
  lineTotal: number;
}

interface QuotationForPrint {
  quotationNumber: string;
  status: string;
  createdAt: string;
  expiresAt?: string | null;
  observations?: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  customer?: { name: string; phone?: string; direction?: string | null; dni?: string | null } | null;
  seller?: { name?: string | null } | null;
  user: { name?: string | null };
  priceList?: { name: string } | null;
  warehouse: { name: string };
  convertedSale?: { saleNumber: string } | null;
  items: QuotationItem[];
}

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Pendiente",
  ACCEPTED:  "Aceptada",
  REJECTED:  "Rechazada",
  EXPIRED:   "Expirada",
  CONVERTED: "Convertida a venta",
};

const PAGE_WIDTHS: Record<string, number> = {
  ticket:       226,
  letter:       816,
  "half-letter": 612,
};

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("es-HN");
}
function fmtDatetime(d: string | Date) {
  return new Date(d).toLocaleString("es-HN");
}

function resolveToken(token: string, q: QuotationForPrint, now: Date): string {
  switch (token) {
    case "[QuotationNumber]":  return `Cotización: ${q.quotationNumber}`;
    case "[Factura]":          return q.convertedSale ? `Venta: ${q.convertedSale.saleNumber}` : "";
    case "[Fecha]":            return `Fecha: ${fmtDatetime(q.createdAt)}`;
    case "[FechaExpiracion]":  return q.expiresAt ? `Expira: ${fmtDate(q.expiresAt)}` : "";
    case "[Estatus]":          return `Estado: ${STATUS_LABEL[q.status] ?? q.status}`;
    case "[NombreCliente]":    return q.customer ? `Cliente: ${q.customer.name}` : "";
    case "[DireccionCliente]": return q.customer?.direction ? `Dirección: ${q.customer.direction}` : "";
    case "[TelefonoCliente]":  return q.customer?.phone ? `Tel: ${String(q.customer.phone)}` : "";
    case "[DNI]":              return q.customer?.dni ? `DNI/RTN: ${q.customer.dni}` : "";
    case "[RTN]":              return q.customer?.dni ? `RTN: ${q.customer.dni}` : "";
    case "[RTNEmisor]":        return "";
    case "[NombreVendedor]":   return q.seller?.name ? `Vendedor: ${q.seller.name}` : "";
    case "[Cajero]":           return `Creado por: ${q.user.name ?? ""}`;
    case "[ListaPrecios]":     return q.priceList ? `Lista: ${q.priceList.name}` : "";
    case "[Observaciones]":    return q.observations ? `Obs: ${q.observations}` : "";
    case "[Subtotal]":         return `Subtotal: ${formatCurrency(q.subtotal)}`;
    case "[DescTotal]":        return `Descuento: ${formatCurrency(0)}`; // cotización no tiene discount global expuesto
    case "[ImpTotal]":         return `Impuestos: ${formatCurrency(q.taxTotal)}`;
    case "[Total]":            return `Total: ${formatCurrency(q.total)}`;
    case "[MetodoPago]":
    case "[Monto]":
    case "[Cambio]":
    case "[TotalComision]":
    case "[PuntosUsados]":
    case "[PuntosGanados]":
    case "[ComisionVendedor]": return "";
    case "[CAI]":
    case "[RangoAutorizado]":
    case "[FechaLimiteEmision]": return "";
    default:
      // Tokens de fecha/hora en estáticos
      if (token === "[Fecha]")  return fmtDatetime(now);
      if (token === "[Hora]")   return now.toLocaleTimeString("es-HN");
      return token;
  }
}

function resolveItemToken(token: string, item: QuotationItem): string {
  switch (token) {
    case "[Producto]":   return item.product.name;
    case "[SKU]":        return item.product.sku;
    case "[Cantidad]":   return String(item.quantity);
    case "[PrecioUnit]": return formatCurrency(item.price);
    case "[Descuento]":  return item.discountAmount ? formatCurrency(item.discountAmount) : "—";
    case "[Impuesto]":   return item.taxAmount ? formatCurrency(item.taxAmount) : "—";
    case "[Importe]":    return formatCurrency(item.lineSubtotal);
    case "[Totales]":    return formatCurrency(item.lineTotal);
    case "[Comision]":   return "";
    default:             return "";
  }
}

export function resolveQuotationTemplate(
  config: ReportTemplateConfig,
  quotation: QuotationForPrint,
): string {
  const now    = new Date();
  const pgSize = config.pageSize ?? "ticket";
  const DOC_W  = config.pageSize === "custom"
    ? (config.customPageWidth ?? 560)
    : PAGE_WIDTHS[pgSize] ?? 560;

  const logoHtml = config.logoBase64
    ? `<img src="${config.logoBase64}" style="position:absolute;left:${config.logoX ?? 8}px;top:${config.logoY ?? 8}px;width:${config.logoWidth ?? 80}px;height:${config.logoHeight ?? 60}px;object-fit:contain;z-index:10;" />`
    : "";

  function renderSection(sectionId: string, minH: number, bg: string, extraHtml = "") {
    const els = config.elements.filter(e => e.section === sectionId);
    const h   = Math.max(minH, ...els.map(e => e.y + (e.fontSize ?? 11) + 8), minH);
    const inner = els.map(el => {
      const raw = el.type === "static"
        ? el.label
            .replace(/\[Fecha\]/g, fmtDatetime(now))
            .replace(/\[Hora\]/g,  now.toLocaleTimeString("es-HN"))
        : resolveToken(el.token, quotation, now);
      if (!raw) return "";
      const cl = el.color ? `color:${el.color};` : "";
      return `<span style="position:absolute;left:${el.x}px;top:${el.y}px;font-size:${el.fontSize ?? 11}px;font-weight:${el.fontWeight ?? "normal"};${cl}text-align:${el.align ?? "left"};">${raw}</span>`;
    }).join("");
    return `<div style="position:relative;width:${DOC_W}px;min-height:${h}px;background:${bg};border-bottom:1px solid #e5e7eb;overflow:hidden;">${extraHtml}${inner}</div>`;
  }

  // ── Tabla de partidas ──────────────────────────────────────────────────
  const cols    = config.detailColumns?.length ? config.detailColumns : [];
  const fixedW  = cols.filter(c => c.width > 0).reduce((a, c) => a + c.width, 0);
  const flexW   = Math.max(60, DOC_W - fixedW - 16);
  const colW    = (c: DetailColumn) => c.width === 0 ? flexW : c.width;
  const headerH = config.headerHeight ?? 130;

  const thead = cols.map(c =>
    `<th style="width:${colW(c)}px;text-align:${c.align};padding:2px 4px;font-size:${c.fontSize ?? 9}px;border-bottom:1px solid #666;">${c.header}</th>`
  ).join("");

  const tbody = quotation.items.map(item =>
    `<tr>${cols.map(c =>
      `<td style="width:${colW(c)}px;text-align:${c.align};padding:2px 4px;font-size:${c.fontSize ?? 9}px;">${resolveItemToken(c.token, item)}</td>`
    ).join("")}</tr>`
  ).join("");

  const detailHtml = cols.length
    ? `<div style="width:${DOC_W}px;padding:0 8px 8px;box-sizing:border-box;min-height:${config.detailHeight ?? 110}px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr>${thead}</tr></thead>
          <tbody>${tbody}</tbody>
        </table>
      </div>`
    : "";

  const body = [
    renderSection("header", headerH, "#fffef9", logoHtml),
    detailHtml,
    renderSection("totals", config.totalsHeight ?? 100, "#fffef9"),
    renderSection("footer",  config.footerHeight ?? 50, "#ffffff"),
  ].join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Cotización ${quotation.quotationNumber}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:Arial,sans-serif;font-size:11px;}
    @media print{@page{margin:6mm;size:${pgSize === "letter" ? "letter" : pgSize === "half-letter" ? "5.5in 8.5in" : "80mm auto"};}}
  </style>
</head>
<body>
  <div style="width:${DOC_W}px;margin:0 auto;">
    ${body}
  </div>
  <script>window.onload=()=>{window.print();}<\/script>
</body>
</html>`;
}
