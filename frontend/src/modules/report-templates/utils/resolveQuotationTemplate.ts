import type { ReportFieldElement, ReportTemplateConfig, DetailColumn } from "../types/report-template";
import { formatCurrency } from "../../../core/utils/formatters";
import { resolvePageCss, resolveToken, DESIGNER_DOC_W } from "./resolveTemplate";

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

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("es-HN");
}
function fmtDatetime(d: string | Date) {
  return new Date(d).toLocaleString("es-HN");
}

function resolveQuotationTokens(q: QuotationForPrint, now: Date): Record<string, string> {
  return {
    "[QuotationNumber]":  `Cotización: ${q.quotationNumber}`,
    "[Factura]":          q.convertedSale ? `Venta: ${q.convertedSale.saleNumber}` : "",
    "[Fecha]":            `Fecha: ${fmtDatetime(q.createdAt)}`,
    "[Hora]":             now.toLocaleTimeString("es-HN"),
    "[FechaExpiracion]":  q.expiresAt ? `Expira: ${fmtDate(q.expiresAt)}` : "",
    "[Estatus]":          `Estado: ${STATUS_LABEL[q.status] ?? q.status}`,
    "[NombreCliente]":    q.customer ? `Cliente: ${q.customer.name}` : "",
    "[DireccionCliente]": q.customer?.direction ? `Dirección: ${q.customer.direction}` : "",
    "[TelefonoCliente]":  q.customer?.phone ? `Tel: ${String(q.customer.phone)}` : "",
    "[DNI]":              q.customer?.dni ? `DNI/RTN: ${q.customer.dni}` : "",
    "[RTN]":              q.customer?.dni ? `RTN: ${q.customer.dni}` : "",
    "[RTNEmisor]":        "",
    "[NombreVendedor]":   q.seller?.name ? `Vendedor: ${q.seller.name}` : "",
    "[Cajero]":           `Creado por: ${q.user.name ?? ""}`,
    "[ListaPrecios]":     q.priceList ? `Lista: ${q.priceList.name}` : "",
    "[Observaciones]":    q.observations ? `Obs: ${q.observations}` : "",
    "[Subtotal]":         `Subtotal: ${formatCurrency(q.subtotal)}`,
    "[DescTotal]":        `Descuento: ${formatCurrency(0)}`,
    "[ImpTotal]":         `Impuestos: ${formatCurrency(q.taxTotal)}`,
    "[Total]":            `Total: ${formatCurrency(q.total)}`,
    "[MetodoPago]": "", "[Monto]": "", "[Cambio]": "", "[TotalComision]": "",
    "[PuntosUsados]": "", "[PuntosGanados]": "", "[ComisionVendedor]": "",
    "[CAI]": "", "[RangoAutorizado]": "", "[FechaLimiteEmision]": "",
  };
}

function resolveQuotationItemTokens(item: QuotationItem): Record<string, string> {
  return {
    "[Producto]":   item.product.name,
    "[SKU]":        item.product.sku,
    "[Cantidad]":   String(item.quantity),
    "[PrecioUnit]": formatCurrency(item.price),
    "[Descuento]":  item.discountAmount ? formatCurrency(item.discountAmount) : "—",
    "[Impuesto]":   item.taxAmount ? formatCurrency(item.taxAmount) : "—",
    "[Importe]":    formatCurrency(item.lineSubtotal),
    "[Totales]":    formatCurrency(item.lineTotal),
    "[Comision]":   "",
  };
}

export function resolveQuotationTemplate(
  config: ReportTemplateConfig,
  quotation: QuotationForPrint,
): string {
  const now = new Date();
  const globalTokens = resolveQuotationTokens(quotation, now);
  const { pageRule, docWidth, printWidthPx, fixedHeightMm } = resolvePageCss(config);
  const scale = printWidthPx / DESIGNER_DOC_W;

  const DEFAULT_DETAIL_COLUMNS: DetailColumn[] = [
    { id: "dc1", header: "Cant.",       token: "[Cantidad]",   width: 44, align: "center", fontSize: 8 },
    { id: "dc2", header: "Descripción", token: "[Producto]",   width: 0,  align: "left",    fontSize: 9 },
    { id: "dc3", header: "P.U.",        token: "[PrecioUnit]", width: 70, align: "right" },
    { id: "dc4", header: "% Desc",      token: "[Descuento]",  width: 60, align: "right",   fontSize: 7 },
    { id: "dc5", header: "Importe",     token: "[Importe]",    width: 72, align: "right" },
  ];

  const detailColumns: DetailColumn[] =
    config.detailColumns?.length ? config.detailColumns : DEFAULT_DETAIL_COLUMNS;

  const totalFixedPx = detailColumns.reduce((s, c) => s + (c.width > 0 ? c.width : 0), 0);
  const flexCount    = detailColumns.filter(c => c.width === 0).length;

  const detailFontPx = Math.max(6, Math.round(9 * scale));
  const detailPadPx  = Math.max(1, Math.round(3 * scale));

  const colStyle = (col: DetailColumn): string => {
    const colFontPx = col.fontSize
      ? Math.max(6, Math.round(col.fontSize * scale))
      : detailFontPx;
    const pad = `padding:${detailPadPx}px;overflow:hidden;font-size:${colFontPx}px;white-space:nowrap;`;
    if (col.width === 0) {
      const flexPct = flexCount > 0
        ? ((DESIGNER_DOC_W - totalFixedPx) / flexCount / DESIGNER_DOC_W * 100).toFixed(2)
        : "20";
      return `width:${flexPct}%;text-align:${col.align};${pad}`;
    }
    const pct = (col.width / DESIGNER_DOC_W * 100).toFixed(2);
    return `width:${pct}%;flex-shrink:0;text-align:${col.align};${pad}`;
  };

  const detailHeaderHtml = detailColumns
    .map(col => `<span style="${colStyle(col)}">${col.header}</span>`)
    .join("");

  const detailRowsHtml = quotation.items.map(item => {
    const itemTokens = resolveQuotationItemTokens(item);
    const cells = detailColumns
      .map(col => `<span style="${colStyle(col)}">${resolveToken(col.token, itemTokens)}</span>`)
      .join("");
    return `<div style="display:flex;width:100%;padding:${detailPadPx}px 0;border-bottom:1px solid #f5f5f5;">${cells}</div>`;
  }).join("");

  const bySection = (sectionId: string) =>
    (config.elements ?? [])
      .filter(el => el.section === sectionId)
      .sort((a, b) => a.y - b.y || a.x - b.x);

  const renderEl = (el: ReportFieldElement, tokens: Record<string, string>) => {
    const text = el.type === "field"
      ? resolveToken(el.token, tokens)
      : el.label.replace(/\[\w+\]/g, t => tokens[t] ?? t);
    if (!text) return "";
    const fw = el.fontWeight === "bold" ? "font-weight:700;" : "";
    const cl = el.color ? `color:${el.color};` : "";
    const scaledX    = Math.round(el.x * scale);
    const scaledY    = Math.round(el.y * scale);
    const scaledFont = Math.max(7, Math.round((el.fontSize ?? 11) * scale));
    const fs = `font-size:${scaledFont}px;`;
    const ta = el.align ? `text-align:${el.align};` : "";
    return `<div style="position:absolute;left:${scaledX}px;top:${scaledY}px;${fw}${cl}${fs}${ta}white-space:nowrap;max-width:calc(100% - ${scaledX}px);overflow:hidden;">${text}</div>`;
  };

  const logoBg = config.logoBackground && config.logoBackground !== "transparent"
    ? `background-color:${config.logoBackground};`
    : "";
  const logoHtml = config.logoBase64
    ? `<img src="${config.logoBase64}" style="position:absolute;left:${Math.round((config.logoX ?? 8) * scale)}px;top:${Math.round((config.logoY ?? 8) * scale)}px;width:${Math.round((config.logoWidth ?? 80) * scale)}px;height:${Math.round((config.logoHeight ?? 60) * scale)}px;object-fit:contain;z-index:10;${logoBg}" />`
    : "";

  const headerEls = bySection("header").map(el => renderEl(el, globalTokens)).join("");
  const totalsEls = bySection("totals").map(el => renderEl(el, globalTokens)).join("");
  const footerEls = bySection("footer").map(el => renderEl(el, globalTokens)).join("");

  const isTicket = (config.pageSize ?? "ticket") === "ticket";

  const sectionContentH = (sectionId: string, fallback: number) => {
    const fields = bySection(sectionId);
    return fields.length
      ? Math.max(...fields.map(el => el.y + (el.fontSize ?? 11) + 8))
      : fallback;
  };

  const headerFields = bySection("header");
  const headerContentH = headerFields.length
    ? Math.max(...headerFields.map(el => el.y + (el.fontSize ?? 11) + 8))
    : 0;
  const headerH = Math.max(config.headerHeight ?? 130, headerContentH);
  const detailH = config.detailHeight ?? 110;

  const totalsH = isTicket
    ? sectionContentH("totals", config.totalsHeight ?? 90)
    : (config.totalsHeight ?? 90);
  const footerH = isTicket
    ? sectionContentH("footer", config.footerHeight ?? 40)
    : (config.footerHeight ?? 40);

  const stampLabel =
    quotation.status === "REJECTED"  ? "RECHAZADA" :
    quotation.status === "EXPIRED"   ? "EXPIRADA"  : null;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Cotización ${quotation.quotationNumber}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #222; }
        .doc { ${docWidth} margin: 0 auto; padding: 0; ${fixedHeightMm ? `display:flex; flex-direction:column; min-height:${fixedHeightMm}mm;` : ""} }
        .section { position: relative; width: 100%; }
        .section-header { min-height: ${Math.round(headerH * scale)}px; border-bottom: 1px solid #ccc; flex-shrink:0; }
        .section-detail-header {
          display: flex; width:100%; background: #f5f5f5;
          border-bottom: 1px solid #ccc; border-top: 1px solid #ccc;
          font-weight: 600;
        }
        .section-totals { min-height: ${Math.round(totalsH * scale)}px; border-top: 1px solid #ccc; }
        .section-footer { min-height: ${Math.round(footerH * scale)}px; border-top: 1px solid #eee; font-size: ${Math.round(10 * scale)}px; color: #888; }
        .status-stamp {
          position: absolute; top: 40px; left: 50%; transform: translateX(-50%) rotate(-15deg);
          font-size: 48px; font-weight: 900; color: rgba(255,0,0,0.15);
          letter-spacing: 4px; pointer-events: none; z-index: 100;
          border: 6px solid rgba(255,0,0,0.15); padding: 4px 12px;
          white-space: nowrap;
        }
        ${pageRule}

        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="doc">
        <div class="section section-header" style="min-height:${Math.round(headerH * scale)}px;">
          ${logoHtml}
          ${headerEls}
          ${stampLabel ? `<div class="status-stamp">${stampLabel}</div>` : ""}
        </div>

        <div class="section-detail-header" style="display:flex;width:100%;">
          ${detailHeaderHtml}
        </div>
        <div class="section section-detail" style="width:100%;overflow:hidden;min-height:${Math.round(detailH * scale)}px;">
          ${detailRowsHtml}
        </div>

        <div style="${fixedHeightMm ? "margin-top:auto;" : ""}">
          <div class="section section-totals" style="min-height:${Math.round(totalsH * scale)}px;">
            ${totalsEls}
          </div>
          <div class="section section-footer" style="min-height:${Math.round(footerH * scale)}px;">
            ${footerEls}
          </div>
        </div>
      </div>
      <script>window.onload=()=>{window.print();}<\/script>
    </body>
    </html>
  `;
}