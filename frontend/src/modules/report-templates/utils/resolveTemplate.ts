import type { ReportFieldElement, ReportTemplateConfig, DetailColumn } from "../../report-templates/types/report-template";
import type { Sale } from "../../sales/types/sale";
import { formatCurrency, formatDate } from "../../../core/utils/formatters";

export function resolveSaleTokens(sale: Sale): Record<string, string> {
  const now = new Date();
  return {
    "[Factura]":          sale.saleNumber ?? "",
    "[Fecha]":            formatDate(sale.createdAt),
    "[Hora]":             now.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" }),
    "[Estatus]":          sale.status === "CANCELLED" ? "Cancelada" : "Completada",
    "[MetodoPago]":       sale.paymentMethod ?? "",
    "[ListaPrecios]":     sale.priceList?.name ?? "",

    "[NombreCliente]":    sale.customer?.name ?? "Consumidor final",
    "[TelefonoCliente]":  sale.customer?.phone ?? "",
    "[DireccionCliente]": sale.customer?.direction ?? "",   
    "[CiudadCliente]":    "",
    "[DNI]":              sale.customer?.dni ?? "",  
    "[Observaciones]":     sale.observations ?? "", 

    "[NombreVendedor]":   sale.seller?.name ?? "",
    "[Cajero]":           sale.user?.name ?? "",
    "[RTNEmisor]":        "", 
    "[CAI]":                sale.fiscalData?.cai               ?? "",
    "[RangoAutorizado]":    sale.fiscalData?.rangeEnd
      ? `Rango:  ${sale.fiscalData.rangeStart ?? ""} al ${sale.fiscalData.rangeEnd}`
      : "",
    "[FechaLimiteEmision]": sale.fiscalData?.expiresAt
      ? `Fecha límite: ${formatDate(sale.fiscalData.expiresAt)}`
      : "",
    "[Monto]":            String(sale.amountPaid ?? ""),
    "[Cambio]":           String(sale.changeAmount ?? ""),

    "[Subtotal]":         formatCurrency(sale.subtotal ?? 0),
    "[DescTotal]":        formatCurrency(sale.discount ?? 0),
    "[ImpTotal]":         formatCurrency(sale.taxTotal ?? 0),
    "[Total]":            formatCurrency(sale.total ?? 0),
    "[TotalComision]":    formatCurrency(sale.totalCommission ?? 0),
    "[PuntosUsados]":     String(sale.pointsUsed ?? 0),
    "[PuntosGanados]":    String(sale.pointsEarned ?? 0),

    "[Producto]":   "",
    "[SKU]":        "",
    "[Cantidad]":   "",
    "[PrecioUnit]": "",
    "[Descuento]":  "",
    "[Importe]":    "",
    "[Impuesto]":   "",
    "[Totales]":      "",
    "[Comision]":   "",
  };
}

export function resolveToken(token: string, values: Record<string, string>): string {
  return values[token] ?? token;
}

export function resolveSaleItemTokens(item: Sale["items"][number]): Record<string, string> {
  return {
    "[Producto]":   item.product?.name ?? "",
    "[SKU]":        item.product?.sku  ?? "",
    "[Cantidad]":   String(item.quantity),
    "[PrecioUnit]": formatCurrency(item.price ?? 0),
    "[Descuento]":  formatCurrency(item.discountAmount ?? 0),
    "[Importe]":    formatCurrency(item.lineSubtotal ?? 0),
    "[Impuesto]":   formatCurrency(item.taxAmount),
    "[Totales]":      formatCurrency(item.lineTotal),
    "[Comision]":   formatCurrency(item.commissionAmount ?? 0),
  };
}

const DESIGNER_DOC_W = 560;

function resolvePageCss(config: ReportTemplateConfig): {
  pageRule: string;
  docWidth: string;
  printWidthPx: number;
} {
  const size = config.pageSize ?? "ticket";
  const mmToPx = (mm: number) => Math.round(mm * 3.7795);

  if (size === "letter") {
    return {
      pageRule: "@page { size: letter portrait; margin: 10mm; }",
      docWidth: "width:190mm;",
      printWidthPx: mmToPx(190),   
    };
  }
  if (size === "half-letter") {
    return {
      pageRule: "@page { size: 216mm 140mm landscape; margin: 8mm; }",
      docWidth: "width:200mm;",
      printWidthPx: mmToPx(200),   
    };
  }
  if (size === "custom") {
    const w = config.customPageWidth  ?? 80;
    const h = config.customPageHeight;
    const sizeVal = h ? `${w}mm ${h}mm` : `${w}mm auto`;
    const printW = w - 8;          
    return {
      pageRule: `@page { size: ${sizeVal}; margin: 4mm; }`,
      docWidth: `width:${printW}mm;`,
      printWidthPx: mmToPx(printW),
    };
  }
  return {
    pageRule: "@page { size: 80mm auto; margin: 4mm 2mm; }",
    docWidth: "width:76mm;",
    printWidthPx: mmToPx(76),      
  };
}

export function resolveWindowSize(config: ReportTemplateConfig): { width: number; height: number } {
  const size = config.pageSize ?? "ticket";

  if (size === "letter")      return { width: 850,  height: 1100 };
  if (size === "half-letter") return { width: 900,  height: 620  };
  if (size === "custom") {
    const mmToPx = (mm: number) => Math.round(mm * 3.7795);
    const w = mmToPx((config.customPageWidth  ?? 80) + 20);
    const h = mmToPx((config.customPageHeight ?? 200) + 40);
    return { width: w, height: Math.min(h, 1200) };
  }
  return { width: 380, height: 700 };
}

export function buildSaleHtml(
  sale: Sale,
  config: ReportTemplateConfig,
): string {
  const globalTokens = resolveSaleTokens(sale);
  const { pageRule, docWidth, printWidthPx } = resolvePageCss(config);

  const scale = printWidthPx / DESIGNER_DOC_W;

  const DEFAULT_DETAIL_COLUMNS: DetailColumn[] = [
    { id: "dc1", header: "Cant.",       token: "[Cantidad]",   width: 44,  align: "center", fontSize: 8 },
    { id: "dc2", header: "Descripción", token: "[Producto]",   width: 0,   align: "left", fontSize: 9   },
    { id: "dc3", header: "P.U.",        token: "[PrecioUnit]", width: 70,  align: "right"  },
    { id: "dc4", header: "% Desc",      token: "[Descuento]",  width: 60,  align: "right", fontSize: 7  },
    { id: "dc5", header: "Importe",     token: "[Importe]",    width: 72,  align: "right"  },
  ];

  const detailColumns: DetailColumn[] =
    config.detailColumns?.length ? config.detailColumns : DEFAULT_DETAIL_COLUMNS;

  const totalFixedPx  = detailColumns.reduce((s, c) => s + (c.width > 0 ? c.width : 0), 0);
  const flexCount     = detailColumns.filter(c => c.width === 0).length;

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

  const detailRowsHtml = (sale.items ?? []).map(item => {
    const itemTokens = resolveSaleItemTokens(item);
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
    const fw  = el.fontWeight === "bold" ? "font-weight:700;" : "";
    const cl  = el.color ? `color:${el.color};` : "";
    const scaledX    = Math.round(el.x * scale);
    const scaledY    = Math.round(el.y * scale);
    const scaledFont = Math.max(7, Math.round((el.fontSize ?? 11) * scale));
    const fs  = `font-size:${scaledFont}px;`;
    const ta  = el.align ? `text-align:${el.align};` : "";
    return `<div style="position:absolute;left:${scaledX}px;top:${scaledY}px;${fw}${cl}${fs}${ta}white-space:nowrap;max-width:calc(100% - ${scaledX}px);overflow:hidden;">${text}</div>`;
  };

  const headerEls = bySection("header").map(el => renderEl(el, globalTokens)).join("");
  const headerH = config.headerHeight ?? 130;
  const detailH = config.detailHeight ?? 110;
  const totalsH = config.totalsHeight ?? 90;
  const footerH = config.footerHeight ?? 40;
  const logoHtml = config.logoBase64
  ? `<img src="${config.logoBase64}" style="position:absolute;left:${Math.round((config.logoX ?? 8) * scale)}px;top:${Math.round((config.logoY ?? 8) * scale)}px;width:${Math.round((config.logoWidth ?? 80) * scale)}px;height:${Math.round((config.logoHeight ?? 60) * scale)}px;object-fit:contain;z-index:10;" />`
  : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Venta ${sale.saleNumber}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #222; }
        .doc { ${docWidth} margin: 0 auto; padding: 0; }
        .section { position: relative; width: 100%; }
        .section-header { min-height: ${Math.round(headerH * scale)}px; border-bottom: 1px solid #ccc; overflow:hidden; }
        .section-detail-header {
          display: flex; width:100%; background: #f5f5f5;
          border-bottom: 1px solid #ccc; border-top: 1px solid #ccc;
          font-weight: 600;
        }
        .section-totals { min-height: ${Math.round(totalsH * scale)}px; border-top: 1px solid #ccc; overflow:hidden; }
        .section-footer { min-height: ${Math.round(footerH * scale)}px; border-top: 1px solid #eee; font-size: ${Math.round(10 * scale)}px; color: #888; overflow:hidden; }
        .cancelled-stamp {
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
        <!-- Encabezado -->
        <div class="section section-header" style="min-height:${Math.round(headerH * scale)}px;">
          ${logoHtml}
          ${headerEls}
          ${sale.status === "CANCELLED" ? '<div class="cancelled-stamp">CANCELADA</div>' : ""}
        </div>

        <!-- Tabla de partidas -->
        <div class="section-detail-header" style="display:flex;width:100%;">
          ${detailHeaderHtml}
        </div>
        <div class="section section-detail" style="width:100%;overflow:hidden;">
          ${detailRowsHtml}
        </div>

        <div class="section section-detail" style="width:100%;overflow:hidden;min-height:${Math.round(detailH * scale)}px;">
        <div class="section section-totals" style="min-height:${Math.round(totalsH * scale)}px;position:relative;">
        <div class="section section-footer" style="min-height:${Math.round(footerH * scale)}px;position:relative;">

      </div>
    </body>
    </html>
  `;
}