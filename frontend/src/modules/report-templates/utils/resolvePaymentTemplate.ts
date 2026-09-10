import type { ReportFieldElement, ReportTemplateConfig } from "../types/report-template";
import { formatCurrency } from "../../../core/utils/formatters";
import { resolvePageCss, resolveToken, resolveDesignerWidth } from "./resolveTemplate";

export interface PaymentForPrint {
  id?: number;
  customer: { id: number; name: string };
  previousBalance: number;
  amountPaid: number;
  currentBalance: number;
  payment: { id: number; note?: string | null; paymentDate: string | Date };
  bankName?: string | null;
  createdAt?: string | Date;
}

function fmtDatetime(d: string | Date) {
  return new Date(d).toLocaleString("es-HN");
}

function resolvePaymentTokens(p: PaymentForPrint, now: Date): Record<string, string> {
  return {
    "[NumeroAbono]":   p.payment.id ? `Recibo: ${p.payment.id}` : "",
    "[Fecha]":         `Fecha: ${fmtDatetime(p.payment.paymentDate ?? now)}`,
    "[Hora]":          now.toLocaleTimeString("es-HN"),
    "[NombreCliente]": `Cliente: ${p.customer.name}`,
    "[SaldoAnterior]": `Saldo anterior: ${formatCurrency(Number(p.previousBalance))}`,
    "[MontoAbono]":    `Abono: ${formatCurrency(Number(p.amountPaid))}`,
    "[SaldoActual]":   `Saldo actual: ${formatCurrency(Number(p.currentBalance))}`,
    "[Banco]":         p.bankName ? `Cuenta: ${p.bankName}` : "",
    "[Nota]":          p.payment.note ? `Nota: ${p.payment.note}` : "",
    // Tokens de otros documentos no aplican aquí, se dejan vacíos
    "[Factura]": "", "[QuotationNumber]": "", "[RemisionNumero]": "",
    "[Subtotal]": "", "[DescTotal]": "", "[ImpTotal]": "", "[Total]": "",
    "[CAI]": "", "[RangoAutorizado]": "", "[FechaLimiteEmision]": "",
    "[RTNEmisor]": "", "[Estatus]": "",
  };
}

function renderDetailSection(
  config: ReportTemplateConfig,
  tokens: Record<string, string>,
  scale: number,
  isTicket: boolean,
): string {
  const minFont = isTicket ? 9 : 7;

  if (config.detailLayout === "stacked" && config.detailLines?.length) {
    return config.detailLines.map(line => {
      const fieldsHtml = line.fields.map(f => {
        const text = f.token ? resolveToken(f.token, tokens) : (f.label ?? "");
        if (!text) return "";
        const fw = f.fontWeight === "bold" ? "font-weight:700;" : "";
        const fontSize = Math.max(minFont, Math.round((f.fontSize ?? 11) * scale));
        const ta = f.align ? `text-align:${f.align};` : "";
        const grow = f.wrap ? "flex:1;" : "";
        return `<span style="${fw}font-size:${fontSize}px;${ta}${grow}display:inline-block;">${text}</span>`;
      }).join("");
      if (!fieldsHtml) return "";
      return `<div style="display:flex;justify-content:space-between;gap:6px;padding:2px 0;">${fieldsHtml}</div>`;
    }).join("");
  }

  if (config.detailColumns?.length) {
    const cellsHtml = config.detailColumns.map(col => {
      const text = resolveToken(col.token, tokens);
      const fontSize = Math.max(minFont, Math.round((col.fontSize ?? 11) * scale));
      const w = Math.round(col.width * scale);
      return `<div style="width:${w}px;text-align:${col.align};font-size:${fontSize}px;">${text}</div>`;
    }).join("");
    return `<div style="display:flex;padding:2px 0;">${cellsHtml}</div>`;
  }

  return "";
}

export function resolvePaymentTemplate(
  config: ReportTemplateConfig,
  payment: PaymentForPrint,
): string {
  const now = new Date();
  const tokens = resolvePaymentTokens(payment, now);
  const { pageRule, docWidth, printWidthPx, fixedHeightMm } = resolvePageCss(config);
  const designerW = resolveDesignerWidth(config.pageSize, config.customPageWidth);
  const scale = printWidthPx / designerW;
  const isTicket = (config.pageSize ?? "ticket") === "ticket";

  const bySection = (sectionId: string) =>
    (config.elements ?? [])
      .filter(el => el.section === sectionId)
      .sort((a, b) => a.y - b.y || a.x - b.x);

  const renderEl = (el: ReportFieldElement) => {
    if (el.type === "divider") {
      const scaledX = Math.round(el.x * scale);
      const scaledY = Math.round(el.y * scale);
      const scaledW = Math.round((el.width ?? 200) * scale);
      const style = el.dividerStyle ?? "dashed";
      const thickness = style === "double" ? 3 : 1;
      return `<div style="position:absolute;left:${scaledX}px;top:${scaledY}px;width:${scaledW}px;border-top:${thickness}px ${style} ${el.color ?? "#999"};"></div>`;
    }
    const text = el.type === "field"
      ? resolveToken(el.token, tokens)
      : el.label.replace(/\[\w+\]/g, t => tokens[t] ?? t);
    if (!text) return "";
    const fw = el.fontWeight === "bold" ? "font-weight:700;" : "";
    const cl = el.color ? `color:${el.color};` : "";
    const scaledX = Math.round(el.x * scale);
    const scaledY = Math.round(el.y * scale);
    const minFont = isTicket ? 9 : 7;
    const scaledFont = Math.max(minFont, Math.round((el.fontSize ?? 11) * scale));
    const ta = el.align ? `text-align:${el.align};` : "";
    return `<div style="position:absolute;left:${scaledX}px;top:${scaledY}px;${fw}${cl}font-size:${scaledFont}px;${ta}white-space:nowrap;max-width:calc(100% - ${scaledX}px);overflow:hidden;">${text}</div>`;
  };

  // Sin partidas: "detalle" se pinta una sola vez, igual que header/totales/pie.
  const headerEls = bySection("header").map(renderEl).join("");
  const detailEls =
    bySection("detail").map(renderEl).join("") ||
    renderDetailSection(config, tokens, scale, isTicket);
  const totalsEls = bySection("totals").map(renderEl).join("");
  const footerEls = bySection("footer").map(renderEl).join("");

  const sectionH = (id: string, fallback: number) => {
    const fields = bySection(id);
    return fields.length ? Math.max(...fields.map(el => el.y + (el.fontSize ?? 11) + 8)) : fallback;
  };
  const headerH = Math.max(config.headerHeight ?? 130, sectionH("header", 0));
  const detailH = Math.max(config.detailHeight ?? 60, sectionH("detail", 0));
  const totalsH = sectionH("totals", config.totalsHeight ?? 60);
  const footerH = sectionH("footer", config.footerHeight ?? 40);

  const logoBg = config.logoBackground && config.logoBackground !== "transparent"
    ? `background-color:${config.logoBackground};` : "";
  const logoHtml = config.logoBase64
    ? `<img src="${config.logoBase64}" style="position:absolute;left:${Math.round((config.logoX ?? 8) * scale)}px;top:${Math.round((config.logoY ?? 8) * scale)}px;width:${Math.round((config.logoWidth ?? 80) * scale)}px;height:${Math.round((config.logoHeight ?? 60) * scale)}px;object-fit:contain;z-index:10;${logoBg}" />`
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Abono - ${payment.customer.name}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #222; }
        .doc { ${docWidth} margin: 0 auto; padding: 0; ${fixedHeightMm ? `display:flex;flex-direction:column;min-height:${fixedHeightMm}mm;` : ""} }
        .section { position: relative; width: 100%; }
        .section-header { min-height:${Math.round(headerH * scale)}px; border-bottom:1px solid #ccc; flex-shrink:0; }
        .section-detail { min-height:${Math.round(detailH * scale)}px; border-bottom:1px solid #eee; }
        .section-totals { min-height:${Math.round(totalsH * scale)}px; border-top:1px solid #ccc; }
        .section-footer { min-height:${Math.round(footerH * scale)}px; border-top:1px solid #eee; font-size:${Math.round(10 * scale)}px; color:#888; }
        ${pageRule}
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <div class="doc">
        <div class="section section-header">${logoHtml}${headerEls}</div>
        <div class="section section-detail">${detailEls}</div>
        <div style="${fixedHeightMm ? "margin-top:auto;" : ""}">
          <div class="section section-totals">${totalsEls}</div>
          <div class="section section-footer">${footerEls}</div>
        </div>
      </div>
      <script>window.onload=()=>{window.print();}<\/script>
    </body>
    </html>
  `;
}