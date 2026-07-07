import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button, Select, Input, Checkbox, Modal, Form,
  message, Spin, Tooltip, Tag, Divider, Dropdown, type MenuProps,
} from "antd";
import {
  SaveOutlined, FolderOpenOutlined, CopyOutlined, DeleteOutlined,
  StarFilled, StarOutlined, BoldOutlined, ItalicOutlined, UnderlineOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined,
  ZoomInOutlined, ZoomOutOutlined, EyeOutlined, EyeInvisibleOutlined, FontSizeOutlined, 
  ExportOutlined, ImportOutlined, FileAddOutlined,
} from "@ant-design/icons";
import html2canvas from "html2canvas";
import { exportTemplateToPdf, importTemplateFromPdf } from "../utils/templatePdf";
import { useReportTemplates } from "../hooks/useReportTemplates";
import type { ReportTemplate, ReportTemplateConfig, ReportFieldElement, DetailColumn, PageSize } from "../types/report-template";

const { Option } = Select;

type SectionId = "header" | "detail" | "totals" | "footer";

const SECTIONS: { id: SectionId; label: string; minHeight: number; bgColor: string }[] = [
  { id: "header",  label: "ENCABEZADO", minHeight: 130, bgColor: "#fffef9" },
  { id: "detail",  label: "DETALLE",    minHeight: 110, bgColor: "#ffffff" },
  { id: "totals",  label: "TOTALES",    minHeight: 100, bgColor: "#fffef9" },
  { id: "footer",  label: "PIE",        minHeight: 50,  bgColor: "#ffffff" },
];

const FIELD_GROUPS = [
  { id: "venta", label: "Venta", fields: [
    { token: "[Factura]",       label: "# Factura" },
    { token: "[Fecha]",         label: "Fecha" },
    { token: "[Estatus]",       label: "Estatus" },
    { token: "[MetodoPago]",    label: "Método de pago" },
    { token: "[ListaPrecios]",  label: "Lista de precios" },
    { token: "[Monto]",         label: "Monto" },
    { token: "[Cambio]",        label: "Cambio" },
    { token: "[Observaciones]", label: "Observaciones" },
  ]},
  { id: "cliente", label: "Cliente", fields: [
    { token: "[NombreCliente]",    label: "Nombre del cliente" },
    { token: "[DireccionCliente]", label: "Dirección" },
    { token: "[CiudadCliente]",    label: "Ciudad" },
    { token: "[DNI]",              label: "DNI" },
    { token: "[TelefonoCliente]",  label: "Telefono" },
  ]},
  { id: "vendedor", label: "Vendedor", fields: [
    { token: "[NombreVendedor]",   label: "Vendedor" },
    { token: "[Cajero]",           label: "Cajero" },
    { token: "[ComisionVendedor]", label: "Comisión" },
  ]},
  { id: "partidas", label: "Partidas", fields: [
    { token: "[Producto]",    label: "Producto" },
    { token: "[SKU]",         label: "SKU" },
    { token: "[Cantidad]",    label: "Cantidad" },
    { token: "[PrecioUnit]",  label: "Precio unitario" },
    { token: "[Descuento]",   label: "% Descuento" },
    { token: "[Impuesto]",    label: "Impuesto" },
    { token: "[Importe]",     label: "Importe" },
    { token: "[Totales]",     label: "Totales" },
    { token: "[Comision]",    label: "Comisión línea" },
    { token: "[Obs.]",        label: "Observación" },
    { token: "[NotaLinea]",   label: "Nota (remisión)" },
  ]},
  { id: "totales", label: "Totales", fields: [
    { token: "[Subtotal]",      label: "Subtotal" },
    { token: "[DescTotal]",     label: "Descuento total" },
    { token: "[ImpTotal]",      label: "Impuestos" },
    { token: "[Total]",         label: "Total" },
    { token: "[MontoEnLetras]", label: "Monto en letras" },
    { token: "[TotalComision]", label: "Comisión total" },
    { token: "[PuntosUsados]",  label: "Puntos usados" },
    { token: "[PuntosGanados]", label: "Puntos ganados" },
  ]},
  { id: "fiscal", label: "Fiscal (SAR)", fields: [
    { token: "[CAI]",               label: "CAI" },
    { token: "[RangoAutorizado]",   label: "Rango autorizado" },
    { token: "[FechaLimiteEmision]",label: "Fecha límite emisión" },
  ]},
  { id: "cotizacion", label: "Cotización", fields: [
    { token: "[QuotationNumber]", label: "# Cotización"      },
    { token: "[Factura]",         label: "# Factura (si aplica)" },
    { token: "[Fecha]",           label: "Fecha"             },
    { token: "[FechaExpiracion]", label: "Fecha expiración"  },
    { token: "[Estatus]",         label: "Estatus"           },
    { token: "[ListaPrecios]",    label: "Lista de precios"  },
    { token: "[Observaciones]",   label: "Observaciones"     },
  ]},
  { id: "remision", label: "Remisión", fields: [
    { token: "[RemisionNumero]", label: "# Remisión"     },
    { token: "[Fecha]",          label: "Fecha"          },
    { token: "[Estatus]",        label: "Estatus"        },
    { token: "[NombreCliente]",  label: "Cliente"        },
    { token: "[Almacen]",        label: "Almacén"        },
    { token: "[Cajero]",         label: "Creado por"     },
    { token: "[Observaciones]",  label: "Nota"           },
  ]},
];

const DEFAULT_ELEMENTS: ReportFieldElement[] = [
  { id: "e1", type: "static", token: "", label: "MI EMPRESA S.A. DE C.V.", x: 160, y: 14, fontSize: 14, fontWeight: "bold",   align: "left", section: "header" },
  { id: "e2", type: "field",  token: "[RTNEmisor]",      label: "RTN Emisor",      x: 8,   y: 14,  fontSize: 11, fontWeight: "normal", align: "left", section: "header" },
  { id: "e3", type: "field",  token: "[Factura]",        label: "# Factura",       x: 8,   y: 50,  fontSize: 11, fontWeight: "normal", align: "left", section: "header" },
  { id: "e4", type: "field",  token: "[Fecha]",          label: "Fecha",           x: 290, y: 50,  fontSize: 11, fontWeight: "normal", align: "left", section: "header" },
  { id: "e5", type: "field",  token: "[NombreCliente]",  label: "Cliente",         x: 8,   y: 80,  fontSize: 11, fontWeight: "normal", align: "left", section: "header" },
  { id: "e6", type: "field",  token: "[NombreVendedor]", label: "Vendedor",        x: 290, y: 80,  fontSize: 11, fontWeight: "normal", align: "left", section: "header" },
  { id: "e7", type: "field",  token: "[RTN]",            label: "RTN Cliente",     x: 8,   y: 108, fontSize: 11, fontWeight: "normal", align: "left", section: "header" },
  { id: "e8", type: "field",  token: "[MetodoPago]",     label: "Método de pago",  x: 290, y: 108, fontSize: 11, fontWeight: "normal", align: "left", section: "header" },
  { id: "t1", type: "field",  token: "[Cajero]",         label: "Cajero",          x: 8,   y: 12,  fontSize: 11, fontWeight: "normal", align: "left", section: "totals" },
  { id: "t2", type: "field",  token: "[MetodoPago]",     label: "M. Pago",         x: 8,   y: 36,  fontSize: 11, fontWeight: "normal", align: "left", section: "totals" },
  { id: "t3", type: "field",  token: "[Subtotal]",       label: "Subtotal",        x: 350, y: 12,  fontSize: 11, fontWeight: "normal", align: "left", section: "totals" },
  { id: "t4", type: "field",  token: "[DescTotal]",      label: "Descuento",       x: 350, y: 36,  fontSize: 11, fontWeight: "normal", align: "left", section: "totals" },
  { id: "t6", type: "field",  token: "[ImpTotal]",  label: "Impuesto", x: 350, y: 60, fontSize: 11, fontWeight: "normal", align: "left", section: "totals" },
  { id: "t5", type: "field",  token: "[Total]",          label: "Total",           x: 350, y: 60,  fontSize: 13, fontWeight: "bold",   align: "left", section: "totals" },
  { id: "f1", type: "static", token: "", label: "Documento generado por el sistema — [Fecha] [Hora]", x: 130, y: 14, fontSize: 10, fontWeight: "normal", align: "left", section: "footer" },
];

const DEFAULT_CONFIG: ReportTemplateConfig = {
  elements: DEFAULT_ELEMENTS,
  columns: [], filters: [],
  header: { company: "Mi Empresa S.A. de C.V.", title: "Reporte de ventas", showDate: true, showSeller: true, showStatus: true, showPage: false },
  groupBy: "",
  totals: { showSubtotal: true, showDiscount: true, showTotal: true, showCommission: false },
};

// Reportdesigner.tsx — reemplazar resizeLogoDataUrl por estas dos funciones
function resizeDataUrlImage(dataUrl: string, maxDim = 800, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("invalid_image"));
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("no_canvas_ctx")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      const keepPng = dataUrl.startsWith("data:image/png");
      resolve(canvas.toDataURL(keepPng ? "image/png" : "image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

function resizeLogoDataUrl(file: File, maxDim = 800, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resizeDataUrlImage(reader.result as string, maxDim, quality).then(resolve, reject);
    reader.readAsDataURL(file);
  });
}

function genId() { return "el_" + Math.random().toString(36).slice(2, 8); }

const DOC_W = 560;

type CanvasElement = ReportFieldElement & { width?: number };

const SAMPLE_VALUES: Record<string, string> = {
  "[Factura]": "FAC-001-00000123", "[Fecha]": "16/06/2026", "[Hora]": "10:42 AM",
  "[Estatus]": "Completada", "[MetodoPago]": "Efectivo", "[ListaPrecios]": "Lista general",
  "[Monto]": "L. 850.00", "[Cambio]": "L. 0.00", "[Observaciones]": "Cliente frecuente",
  "[NombreCliente]": "Juan Pérez", "[DireccionCliente]": "Col. Trejo, SPS", "[CiudadCliente]": "San Pedro Sula",
  "[DNI]": "0501-1990-01234", "[TelefonoCliente]": "9988-7766",
  "[NombreVendedor]": "María López", "[Cajero]": "María López", "[ComisionVendedor]": "L. 25.50",
  "[RTNEmisor]": "08019999012345", "[RTN]": "0501199001234",
  "[Subtotal]": "L. 758.93", "[DescTotal]": "L. 0.00", "[ImpTotal]": "L. 91.07", "[Total]": "L. 850.00",
  "[TotalComision]": "L. 42.50", "[PuntosUsados]": "0", "[PuntosGanados]": "17",
  "[CAI]": "A1B2C3-D4E5F6-A1B2C3-D4E5F6-A1B2C3-DE",
  "[RangoAutorizado]": "001-001-01-00000001 a 001-001-01-00050000",
  "[FechaLimiteEmision]": "31/12/2026",
  "[QuotationNumber]": "COT-001-00000045", "[FechaExpiracion]": "30/06/2026",
};

const SAMPLE_DETAIL_ROWS: Record<string, string>[] = [
  { "[Cantidad]": "2", "[Producto]": "Coca-Cola 600ml", "[Obs.]": "Producto-1", "[SKU]": "BEB-0012", "[PrecioUnit]": "L. 18.00", "[Descuento]": "0%",  "[Impuesto]": "L. 4.32", "[Importe]": "L. 36.00", "[Totales]": "L. 40.32", "[Comision]": "L. 1.80" },
  { "[Cantidad]": "1", "[Producto]": "Pan Bimbo Grande", "[Obs.]": "Producto-2", "[SKU]": "PAN-0045", "[PrecioUnit]": "L. 45.00", "[Descuento]": "10%", "[Impuesto]": "L. 4.86", "[Importe]": "L. 40.50", "[Totales]": "L. 45.36", "[Comision]": "L. 2.03" },
  { "[Cantidad]": "3", "[Producto]": "Jabón Protex 90g", "[Obs.]": "Producto-3", "[SKU]": "ASO-0078", "[PrecioUnit]": "L. 22.00", "[Descuento]": "0%",  "[Impuesto]": "L. 7.92", "[Importe]": "L. 66.00", "[Totales]": "L. 73.92", "[Comision]": "L. 3.30" },
];

function resolveTokens(text: string): string {
  return text.replace(/\[[^\]]+\]/g, token => SAMPLE_VALUES[token] ?? token);
}

const DEFAULT_DETAIL_COLUMNS: DetailColumn[] = [
  { id: "dc1", header: "Cant.",       token: "[Cantidad]",   width: 44,  align: "center" },
  { id: "dc2", header: "Descripción", token: "[Producto]",   width: 0,   align: "left"   },
  { id: "dc3", header: "P.U.",        token: "[PrecioUnit]", width: 70,  align: "right"  },
  { id: "dc4", header: "% Desc",      token: "[Descuento]",  width: 60,  align: "right"  },
  { id: "dc5", header: "Importe",     token: "[Importe]",    width: 72,  align: "right"  },
  { id: "dc6", header: "Impuesto",    token: "[Impuesto]",   width: 72,  align: "right"  },
  { id: "dc7", header: "Totales",       token: "[Totales]",      width: 72,  align: "right"  },
];

const propLabel: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 4 };

interface PropsPanelProps {
  selectedEl: CanvasElement | null;
  onUpdate: (patch: Partial<CanvasElement>) => void;
  onDelete: () => void;
}

function PropsPanel({ selectedEl, onUpdate, onDelete }: PropsPanelProps) {
  if (!selectedEl) return (
    <div style={{ padding: "20px 12px", textAlign: "center", color: "#bbb", fontSize: 12, lineHeight: 1.6 }}>
      Selecciona un elemento del canvas para editar sus propiedades.
    </div>
  );
  return (
    <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={propLabel}>Etiqueta</div>
        <Input size="small" value={selectedEl.label} onChange={e => onUpdate({ label: e.target.value })} />
      </div>
      {selectedEl.type === "field" && (
        <div>
          <div style={propLabel}>Token</div>
          <Input size="small" value={selectedEl.token} onChange={e => onUpdate({ token: e.target.value })} style={{ fontFamily: "monospace", fontSize: 11 }} />
        </div>
      )}
      <div>
        <div style={propLabel}>Sección</div>
        <Select size="small" style={{ width: "100%" }} value={selectedEl.section} onChange={v => onUpdate({ section: v as SectionId })}>
          {SECTIONS.map(s => <Option key={s.id} value={s.id}>{s.label}</Option>)}
        </Select>
      </div>
      <div>
        <div style={propLabel}>Posición</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <div>
            <div style={{ fontSize: 10, color: "#aaa", marginBottom: 2 }}>X (px)</div>
            <Input size="small" type="number" value={selectedEl.x} onChange={e => onUpdate({ x: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#aaa", marginBottom: 2 }}>Y (px)</div>
            <Input size="small" type="number" value={selectedEl.y} onChange={e => onUpdate({ y: parseInt(e.target.value) || 0 })} />
          </div>
        </div>
      </div>
      <div>
        <div style={propLabel}>Tamaño de fuente</div>
        <Select size="small" style={{ width: "100%" }} value={selectedEl.fontSize ?? 11} onChange={v => onUpdate({ fontSize: v })}>
          {[8,9,10,11,12,13,14,16,18,20,24].map(s => <Option key={s} value={s}>{s}px</Option>)}
        </Select>
      </div>
      <div>
        <div style={propLabel}>Estilo</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
          <Tooltip title="Negrita">
            <Button size="small" icon={<BoldOutlined />} type={selectedEl.fontWeight === "bold" ? "primary" : "default"}
              onClick={() => onUpdate({ fontWeight: selectedEl.fontWeight === "bold" ? "normal" : "bold" })} />
          </Tooltip>
          <Tooltip title="Cursiva">
            <Button size="small" icon={<ItalicOutlined />}
              type={(selectedEl as any).fontStyle === "italic" ? "primary" : "default"}
              onClick={() => onUpdate({ fontStyle: (selectedEl as any).fontStyle === "italic" ? "normal" : "italic" } as any)} />
          </Tooltip>
          <Tooltip title="Subrayado">
            <Button size="small" icon={<UnderlineOutlined />}
              type={(selectedEl as any).textDecoration === "underline" ? "primary" : "default"}
              onClick={() => onUpdate({ textDecoration: (selectedEl as any).textDecoration === "underline" ? "none" : "underline" } as any)} />
          </Tooltip>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <Tooltip title="Izquierda"><Button size="small" icon={<AlignLeftOutlined />} type={(!selectedEl.align || selectedEl.align === "left") ? "primary" : "default"} onClick={() => onUpdate({ align: "left" })} /></Tooltip>
          <Tooltip title="Centro"><Button size="small" icon={<AlignCenterOutlined />} type={selectedEl.align === "center" ? "primary" : "default"} onClick={() => onUpdate({ align: "center" })} /></Tooltip>
          <Tooltip title="Derecha"><Button size="small" icon={<AlignRightOutlined />} type={selectedEl.align === "right" ? "primary" : "default"} onClick={() => onUpdate({ align: "right" })} /></Tooltip>
        </div>
      </div>
      <div>
        <div style={propLabel}>Color de texto</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="color"
            value={selectedEl.color ?? "#222222"}
            onChange={e => onUpdate({ color: e.target.value })}
            style={{ width: 28, height: 28, padding: 0, border: "1px solid #d9d9d9", borderRadius: 4, cursor: "pointer" }}
          />
          <Input
            size="small"
            value={selectedEl.color ?? "#222222"}
            onChange={e => onUpdate({ color: e.target.value })}
            style={{ flex: 1, fontFamily: "monospace", fontSize: 11 }}
          />
        </div>
      </div>
      <Divider style={{ margin: "2px 0" }} />
      <Button size="small" danger icon={<DeleteOutlined />} onClick={onDelete} block>Eliminar elemento</Button>
    </div>
  );
}


export default function ReportDesigner() {
  const {
    templates, loadingList, loadingDetail, saving, deleting, duplicating,
    getById, getDefaultCancellable, create, update, remove, duplicate,
  } = useReportTemplates();

  const [elements,        setElements]        = useState<CanvasElement[]>(DEFAULT_ELEMENTS);
  const [currentTemplate, setCurrentTemplate] = useState<ReportTemplate | null>(null);
  const [isDirty,         setIsDirty]         = useState(false);
  const [selectedId,      setSelectedId]      = useState<string | null>(null);
  const [activeSection,   setActiveSection]   = useState<SectionId>("header");
  const [zoom,            setZoom]            = useState(1);
  const [previewMode,     setPreviewMode] = useState(false);
  const [openGroups,      setOpenGroups]      = useState<Record<string, boolean>>({ cliente: true, partidas: true });

  const [detailColumns,   setDetailColumns]  = useState<DetailColumn[]>(DEFAULT_DETAIL_COLUMNS);
  const [selectedColId,  setSelectedColId]  = useState<string | null>(null);
  const dragColRef = useRef<string | null>(null);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [pageSize,       setPageSize]       = useState<PageSize>("ticket");
  const [headerHeight, setHeaderHeight] = useState<number>(130);
  const [detailHeight, setDetailHeight] = useState<number>(110);
  const [totalsHeight, setTotalsHeight] = useState<number>(100);
  const [footerHeight, setFooterHeight] = useState<number>(50);
  const [logo,       setLogo]       = useState<string | null>(null);
  const [logoX,      setLogoX]      = useState(8);
  const [logoY,      setLogoY]      = useState(8);
  const [logoWidth,  setLogoWidth]  = useState(80);
  const [logoHeight, setLogoHeight] = useState(60);
  const [logoBg, setLogoBg] = useState<string>("transparent");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const exportOverlayRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const draggingLogoRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [documentType, setDocumentType] = useState<'sale' | 'quotation' | 'remission'>('sale');

  type DesignSnapshot = {
    elements: CanvasElement[]; detailColumns: DetailColumn[]; pageSize: PageSize; documentType: 'sale' | 'quotation';
    headerHeight: number; detailHeight: number; totalsHeight: number; footerHeight: number;
    logo: string | null; logoX: number; logoY: number; logoWidth: number; logoHeight: number, logoBg: string;
  };

  // Snapshot de la última config "guardada" (al cargar o guardar una plantilla).
  // Se compara contra el estado actual para saber si hay cambios REALES pendientes,
  const baselineRef = useRef<string>(
    JSON.stringify({
      elements: DEFAULT_ELEMENTS, detailColumns: DEFAULT_DETAIL_COLUMNS,
      pageSize: "ticket", documentType: "sale",
      headerHeight: 130, detailHeight: 110, totalsHeight: 100, footerHeight: 50,
      logo: null, logoX: 8, logoY: 8, logoWidth: 80, logoHeight: 60, logoBg: "transparent",
    } as DesignSnapshot)
  );

  function getSnapshot(over: Partial<DesignSnapshot> = {}): string {
    return JSON.stringify({
      elements, detailColumns, pageSize, documentType,
      headerHeight, detailHeight, totalsHeight, footerHeight,
      logo, logoX, logoY, logoWidth, logoHeight, logoBg,
      ...over,
    });
  }

  const [saveModalOpen,  setSaveModalOpen]  = useState(false);
  const [loadModalOpen,  setLoadModalOpen]  = useState(false);
  const [dupModalOpen,   setDupModalOpen]   = useState(false);
  const [dupTargetId,    setDupTargetId]    = useState<number | null>(null);
  const [selectedLoadId, setSelectedLoadId] = useState<number | null>(null);

  const [saveForm] = Form.useForm();
  const [dupForm]  = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);

  const dragFieldRef  = useRef<{ token: string; label: string } | null>(null);
  const draggingElRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizingRef   = useRef<{ id: string; startX: number; startW: number } | null>(null);

  const selectedEl = elements.find(e => e.id === selectedId) as CanvasElement | undefined ?? null;

  const sectionHeights: Record<SectionId, number> = {
    header: headerHeight, detail: detailHeight, totals: totalsHeight, footer: footerHeight,
  };
  const setSectionHeight: Record<SectionId, (v: number) => void> = {
    header: setHeaderHeight, detail: setDetailHeight, totals: setTotalsHeight, footer: setFooterHeight,
  };

  useEffect(() => {
    let ignore = false;
    getDefaultCancellable(ignore).then(t => { if (!ignore && t) applyTemplate(t, false); });
    return () => { ignore = true; };
  }, []);

  function applyTemplate(t: ReportTemplate, showMessage = true) {
    const newElements = (t.config.elements?.length ? t.config.elements : DEFAULT_ELEMENTS) as CanvasElement[];
    const newDetailColumns = t.config.detailColumns?.length ? t.config.detailColumns : DEFAULT_DETAIL_COLUMNS;
    const newPageSize = t.config.pageSize ?? "ticket";
    const newHeaderHeight = t.config.headerHeight ?? 130;
    const newDetailHeight = t.config.detailHeight ?? 110;
    const newTotalsHeight = t.config.totalsHeight ?? 100;
    const newFooterHeight = t.config.footerHeight ?? 50;
    const newDocumentType = (t.config as any).documentType ?? "sale";
    const newLogo = t.config.logoBase64 ?? null;
    const newLogoX = t.config.logoX ?? 8;
    const newLogoY = t.config.logoY ?? 8;
    const newLogoWidth = t.config.logoWidth ?? 80;
    const newLogoHeight = t.config.logoHeight ?? 60;
    setLogoBg(t.config.logoBackground ?? "transparent");

    setCurrentTemplate(t);
    setElements(newElements);
    setDetailColumns(newDetailColumns);
    setPageSize(newPageSize);
    setHeaderHeight(newHeaderHeight);
    setDetailHeight(newDetailHeight);
    setTotalsHeight(newTotalsHeight);
    setFooterHeight(newFooterHeight);
    setDocumentType(newDocumentType);
    setLogo(newLogo);
    setLogoX(newLogoX);
    setLogoY(newLogoY);
    setLogoWidth(newLogoWidth);
    setLogoHeight(newLogoHeight);
    setIsDirty(false);
    setSelectedId(null);
    setSelectedColId(null);

    baselineRef.current = getSnapshot({
      elements: newElements, detailColumns: newDetailColumns, pageSize: newPageSize, documentType: newDocumentType,
      headerHeight: newHeaderHeight, detailHeight: newDetailHeight, totalsHeight: newTotalsHeight, footerHeight: newFooterHeight,
      logo: newLogo, logoX: newLogoX, logoY: newLogoY, logoWidth: newLogoWidth, logoHeight: newLogoHeight,
    });

    if (showMessage) message.success(`Plantilla "${t.name}" cargada`);
  }

  function markDirty() { setIsDirty(true); }

  function buildConfig(): ReportTemplateConfig {
    const base = currentTemplate?.config ?? DEFAULT_CONFIG;
    return { 
      ...base, elements, detailColumns, pageSize, documentType, 
      headerHeight, detailHeight, totalsHeight, footerHeight, 
      logoBase64: logo ?? undefined,
      logoX, logoY, logoWidth, logoHeight,
    };
  }

  // Recalcula isDirty comparando el estado actual contra el snapshot guardado.
  // Si el usuario revierte un cambio (vuelve al valor original), el indicador
  useEffect(() => {
    setIsDirty(getSnapshot() !== baselineRef.current);
  }, [elements, detailColumns, pageSize, documentType, headerHeight, detailHeight, totalsHeight, footerHeight, logo, logoX, logoY, logoWidth, logoHeight, logoBg]);

  const onFieldDragStart = useCallback((token: string, label: string) => {
    dragFieldRef.current = { token, label };
  }, []);

  function onSectionDrop(e: React.DragEvent<HTMLDivElement>, sectionId: SectionId) {
    e.preventDefault();
    const dragged = dragFieldRef.current;
    if (!dragged) return;
    dragFieldRef.current = null;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.round((e.clientX - rect.left) / zoom) - 40);
    const y = Math.max(0, Math.round((e.clientY - rect.top) / zoom) - 10);
    const newEl: ReportFieldElement = {
      id: genId(), type: "field",
      token: dragged.token,
      label: dragged.label,
      x, y, fontSize: 11, fontWeight: "normal", align: "left", section: sectionId,
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
    markDirty();
  }

  function onLogoMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId("__logo__");
    setSelectedColId(null);
    draggingLogoRef.current = { startX: e.clientX, startY: e.clientY, origX: logoX, origY: logoY };
    const onMove = (ev: MouseEvent) => {
      const d = draggingLogoRef.current;
      if (!d) return;
      setLogoX(Math.max(0, d.origX + Math.round((ev.clientX - d.startX) / zoom)));
      setLogoY(Math.max(0, d.origY + Math.round((ev.clientY - d.startY) / zoom)));
      markDirty();
    };
    const onUp = () => {
      draggingLogoRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function onElMouseDown(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    e.preventDefault();
    if (editingId === id) return;
    setSelectedId(id);
    setSelectedColId(null);
    const el = elements.find(x => x.id === id);
    if (!el) return;
    setActiveSection(el.section as SectionId);
    draggingElRef.current = { id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y };
    const onMove = (ev: MouseEvent) => {
      const drag = draggingElRef.current;
      if (!drag) return;
      const dx = Math.round((ev.clientX - drag.startX) / zoom);
      const dy = Math.round((ev.clientY - drag.startY) / zoom);
      setElements(prev => prev.map(el =>
        el.id === drag.id ? { ...el, x: Math.max(0, drag.origX + dx), y: Math.max(0, drag.origY + dy) } : el
      ));
      markDirty();
    };
    const onUp = () => {
      draggingElRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function onResizeMouseDown(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find(x => x.id === id) as CanvasElement | undefined;
    if (!el) return;
    resizingRef.current = { id, startX: e.clientX, startW: el.width ?? 120 };
    const onMove = (ev: MouseEvent) => {
      const r = resizingRef.current;
      if (!r) return;
      const dx = Math.round((ev.clientX - r.startX) / zoom);
      setElements(prev => prev.map(el =>
        el.id === r.id ? { ...el, width: Math.max(30, r.startW + dx) } : el
      ));
      markDirty();
    };
    const onUp = () => {
      resizingRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function updEl(patch: Partial<CanvasElement>) {
    if (!selectedId) return;
    const id = selectedId;
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...patch } : el));
    markDirty();
  }

  function deleteEl() {
    if (!selectedId) return;
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
    markDirty();
  }

  function addStaticText() {
    const el: ReportFieldElement = {
      id: genId(), type: "static", token: "", label: "Texto estático",
      x: 20, y: 20, fontSize: 12, fontWeight: "normal", align: "left", section: activeSection,
    };
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
    markDirty();
  }

  function quickAddField(token: string, label: string, forceSection?: SectionId) {
    const section = forceSection ?? activeSection;
    const el: ReportFieldElement = {
      id: genId(), type: "field", token, label,
      x: 20 + (Math.random() * 200 | 0), y: 20 + (Math.random() * 40 | 0),
      fontSize: 11, fontWeight: "normal", align: "left", section,
    };
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
    markDirty();
  }

  async function handleSelectorChange(val: string) {
    if (!val) {
      if (isDirty && !window.confirm("¿Descartar cambios sin guardar?")) return;
      setCurrentTemplate(null); setElements(DEFAULT_ELEMENTS); setIsDirty(false); setSelectedId(null); 
      baselineRef.current = getSnapshot({ elements: DEFAULT_ELEMENTS });
      return;
    }
    if (isDirty && !window.confirm("¿Descartar cambios y cargar otra plantilla?")) return;
    const t = await getById(parseInt(val));
    if (!t) { message.error("No se pudo cargar la plantilla"); return; }
    applyTemplate(t);
  }

  async function handleSaveNew(values: { name: string; description?: string; isDefault?: boolean }) {
    const saved = await create({ name: values.name, description: values.description, isDefault: values.isDefault ?? false, config: buildConfig() });
    setCurrentTemplate(saved as ReportTemplate); setIsDirty(false);
    setSaveModalOpen(false); saveForm.resetFields();
    message.success(`Plantilla "${saved.name}" guardada`);
  }

  async function handleSaveChanges() {
    if (!currentTemplate) { saveForm.resetFields(); setSaveModalOpen(true); return; }
    const newConfig = buildConfig();
    await update(currentTemplate.id, { config: newConfig });
    setCurrentTemplate(prev => prev ? { ...prev, config: newConfig } : prev);
    setIsDirty(false);
    baselineRef.current = getSnapshot();
    message.success("Cambios guardados");
  }

  async function handleConfirmLoad() {
    if (!selectedLoadId) return;
    const t = await getById(selectedLoadId);
    if (!t) { message.error("No se pudo cargar la plantilla"); return; }
    applyTemplate(t); setLoadModalOpen(false); setSelectedLoadId(null);
  }

  async function handleDelete(id: number, name: string) {
    Modal.confirm({
      title: "Eliminar plantilla", content: `¿Eliminar "${name}"? Esta acción no se puede deshacer.`,
      okType: "danger", okText: "Eliminar", cancelText: "Cancelar",
      onOk: async () => {
        await remove(id);
        if (currentTemplate?.id === id) { setCurrentTemplate(null); setElements(DEFAULT_ELEMENTS); setIsDirty(false); }
        baselineRef.current = getSnapshot({ elements: DEFAULT_ELEMENTS });
        message.success(`Plantilla "${name}" eliminada`);
      },
    });
  }

  async function handleSetDefault(id: number) {
    await update(id, { isDefault: true });
    message.success("Plantilla marcada como predeterminada");
    if (currentTemplate?.id === id) {
      setCurrentTemplate(prev => prev ? { ...prev, isDefault: true } : prev);
    }
  }

  async function handleDuplicate(values: { name: string }) {
    if (!dupTargetId) return;
    const copy = await duplicate(dupTargetId, values.name);
    dupForm.resetFields(); setDupModalOpen(false);
    message.success(`Plantilla "${copy.name}" creada`);
  }

  async function handleExportTemplate() {
    const wasPreview = previewMode;
    const wasZoom = zoom;
    const wasSelectedId = selectedId;
    const wasSelectedColId = selectedColId;

    if (exportOverlayRef.current) exportOverlayRef.current.style.display = "flex";

    setSelectedId(null);
    setSelectedColId(null);
    setEditingId(null);
    setEditingColId(null);
    setPreviewMode(true);
    setZoom(1);

    await new Promise(r => setTimeout(r, 120));

    try {
      const node = docRef.current;
      if (!node) return;
      const canvas = await html2canvas(node, {
        backgroundColor: "#ffffff",
        scale: 2,
        width: node.scrollWidth,
        height: node.scrollHeight,
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
      });
      
      const imageDataUrl = canvas.toDataURL("image/png");
      const aspectRatio = canvas.width / canvas.height;

      let exportLogo = logo;
      if (logo) {
        try { exportLogo = await resizeDataUrlImage(logo, 240, 0.6); } catch { /* si falla, se exporta tal cual estaba */ }
      }

      exportTemplateToPdf(
        {
          name: currentTemplate?.name ?? "Plantilla sin nombre",
          description: currentTemplate?.description ?? "",
          config: { ...buildConfig(), logoBase64: exportLogo ?? undefined },
        },
        imageDataUrl,
        aspectRatio,
      );
    } finally {
      setPreviewMode(wasPreview);
      setZoom(wasZoom);
      setSelectedId(wasSelectedId);
      setSelectedColId(wasSelectedColId);
      if (exportOverlayRef.current) exportOverlayRef.current.style.display = "none";
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await importTemplateFromPdf(file);
      if (!parsed?.config?.elements) throw new Error("invalid");
      if (isDirty && !window.confirm("¿Descartar cambios sin guardar y cargar la plantilla importada?")) return;

      setCurrentTemplate(null);
      setElements(parsed.config.elements?.length ? parsed.config.elements : DEFAULT_ELEMENTS);
      setDetailColumns(parsed.config.detailColumns?.length ? parsed.config.detailColumns : DEFAULT_DETAIL_COLUMNS);
      setPageSize(parsed.config.pageSize ?? "ticket");
      setHeaderHeight(parsed.config.headerHeight ?? 130);
      setDetailHeight(parsed.config.detailHeight ?? 110);
      setTotalsHeight(parsed.config.totalsHeight ?? 100);
      setFooterHeight(parsed.config.footerHeight ?? 50);
      setDocumentType(parsed.config.documentType ?? "sale");
      setLogo(parsed.config.logoBase64 ?? null);
      setLogoX(parsed.config.logoX ?? 8);
      setLogoY(parsed.config.logoY ?? 8);
      setLogoWidth(parsed.config.logoWidth ?? 80);
      setLogoHeight(parsed.config.logoHeight ?? 60);
      setLogoBg(parsed.config.logoBackground ?? "transparent");
      setIsDirty(true);
      setSelectedId(null);
      setSelectedColId(null);

      saveForm.setFieldsValue({ name: parsed.name ?? "", description: parsed.description ?? "" });
      message.success("Plantilla importada. Revisa el logo y los textos antes de guardar.");
    } catch {
      message.error("El archivo no es una plantilla válida (.pdf exportado desde el diseñador).");
    } finally {
      e.target.value = "";
    }
  }

  function renderEl(el: CanvasElement) {
    const isSel = el.id === selectedId;
    const isEditing = el.id === editingId;
    const elWidth = el.width;

    return (
      <div
        key={el.id}
        onMouseDown={e => !previewMode && onElMouseDown(e, el.id)}
        onDoubleClick={e => { if (previewMode) return; e.stopPropagation(); setSelectedId(el.id); if (el.type === "static") setEditingId(el.id); }}
        style={{
          position: "absolute", left: el.x, top: el.y,
          cursor: previewMode ? "default" : (isEditing ? "text" : "move"),
          userSelect: "none", padding: previewMode ? 0 : "1px 3px",
          border: previewMode ? "none" : `1px dashed ${isSel ? "#1677ff" : "transparent"}`,
          background: previewMode ? "transparent" : (isSel ? "rgba(22,119,255,0.07)" : "transparent"),
          zIndex: isSel ? 10 : 2, minWidth: 30,
          width: elWidth ? elWidth : undefined,
        }}
      >
        {el.type === "field" ? (
          previewMode ? (
            <div style={{ fontSize: el.fontSize ?? 11, fontWeight: el.fontWeight ?? "normal", color: el.color ?? "#222", pointerEvents: "none" }}>
              {resolveTokens(el.token)}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 9, color: "#bbb", lineHeight: 1.2, pointerEvents: "none" }}>{el.label}</div>
              <div style={{ fontSize: el.fontSize ?? 11, fontWeight: el.fontWeight ?? "normal", fontFamily: "monospace", color: el.color ?? "#333", pointerEvents: "none" }}>{el.token}</div>
            </>
          )
        ) : isEditing ? (
          <textarea
            autoFocus
            value={el.label}
            onChange={e2 => {
              setElements(prev => prev.map(item => item.id === el.id ? { ...item, label: e2.target.value } : item));
              markDirty();
            }}
            onBlur={() => setEditingId(null)}
            onKeyDown={e2 => { if (e2.key === "Escape") setEditingId(null); }}
            onMouseDown={e2 => e2.stopPropagation()}
            onClick={e2 => e2.stopPropagation()}
            style={{
              fontSize: el.fontSize ?? 12,
              fontWeight: el.fontWeight ?? "normal",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              color: "#222",
              background: "rgba(255,255,200,0.95)",
              border: "1px solid #1677ff",
              borderRadius: 2,
              outline: "none",
              resize: "none",
              padding: "0 2px",
              lineHeight: 1.4,
              minWidth: 60,
              width: elWidth ? elWidth - 8 : Math.max(80, el.label.length * (el.fontSize ?? 12) * 0.6),
              userSelect: "text",
              cursor: "text",
              overflow: "hidden",
            }}
            rows={1}
          />
        ) : (
          <div style={{ fontSize: el.fontSize ?? 12, fontWeight: el.fontWeight ?? "normal", color: el.color ?? "#222", pointerEvents: "none", whiteSpace: "pre-wrap", textAlign: (el.align as any) ?? "left" }}>
            {previewMode ? resolveTokens(el.label) : el.label}
          </div>
        )}
        {isSel && !isEditing && !previewMode && (
          <>
            <div
              onMouseDown={e => onResizeMouseDown(e, el.id)}
              style={{ position: "absolute", width: 8, height: 8, background: "#1677ff", right: -4, bottom: -4, cursor: "se-resize", borderRadius: 1 }}
            />
            <div style={{ position: "absolute", width: 6, height: 6, background: "#1677ff", right: -3, top: "50%", marginTop: -3, cursor: "e-resize", borderRadius: 1 }} />
          </>
        )}
      </div>
    );
  }

  const fileMenuItems: MenuProps["items"] = [
    { key: "new", icon: <FileAddOutlined />, label: "Nueva plantilla", onClick: () => handleSelectorChange("") },
    { type: "divider" },
    { key: "save", icon: <SaveOutlined />, label: currentTemplate ? "Guardar cambios" : "Guardar plantilla", disabled: !isDirty, onClick: handleSaveChanges },
    { key: "saveAs", icon: <SaveOutlined />, label: "Guardar como...", onClick: () => { saveForm.resetFields(); setSaveModalOpen(true); } },
    { key: "load", icon: <FolderOpenOutlined />, label: "Cargar plantilla...", onClick: () => { setLoadModalOpen(true); setSelectedLoadId(null); } },
    { type: "divider" },
    { key: "import", icon: <ImportOutlined />, label: "Importar plantilla (.pdf)...", onClick: () => importInputRef.current?.click() },
    { key: "export", icon: <ExportOutlined />, label: "Exportar a PDF", onClick: handleExportTemplate },
    { type: "divider" },
    { key: "delete", icon: <DeleteOutlined />, label: "Eliminar plantilla actual", danger: true, disabled: !currentTemplate, onClick: () => currentTemplate && handleDelete(currentTemplate.id, currentTemplate.name) },
  ];

  const editMenuItems: MenuProps["items"] = [
    { key: "addText", icon: <FontSizeOutlined />, label: "Agregar texto", onClick: addStaticText },
    { type: "divider" },
    { key: "deleteEl", icon: <DeleteOutlined />, label: "Eliminar elemento seleccionado", danger: true, disabled: !selectedEl, onClick: deleteEl },
    { type: "divider" },
    { key: "duplicate", icon: <CopyOutlined />, label: "Duplicar plantilla actual...", disabled: !currentTemplate, onClick: () => {
      if (!currentTemplate) return;
      setDupTargetId(currentTemplate.id);
      dupForm.setFieldValue("name", `Copia de ${currentTemplate.name}`);
      setDupModalOpen(true);
    } },
  ];

  const viewMenuItems: MenuProps["items"] = [
    { key: "preview", icon: previewMode ? <EyeInvisibleOutlined /> : <EyeOutlined />, label: previewMode ? "Salir de vista previa" : "Vista previa", onClick: () => {
      setPreviewMode(p => !p); setSelectedId(null); setSelectedColId(null); setEditingId(null); setEditingColId(null);
    } },
    { type: "divider" },
    { key: "zoomIn", icon: <ZoomInOutlined />, label: "Acercar", onClick: () => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1))) },
    { key: "zoomOut", icon: <ZoomOutOutlined />, label: "Alejar", onClick: () => setZoom(z => Math.max(0.5, +(z - 0.1).toFixed(1))) },
    { key: "zoomReset", label: "Restablecer zoom (100%)", onClick: () => setZoom(1) },
    { type: "divider" },
    { key: "secHeader", label: "Ir a: Encabezado", onClick: () => setActiveSection("header") },
    { key: "secDetail", label: "Ir a: Detalle", onClick: () => setActiveSection("detail") },
    { key: "secTotals", label: "Ir a: Totales", onClick: () => setActiveSection("totals") },
    { key: "secFooter", label: "Ir a: Pie", onClick: () => setActiveSection("footer") },
  ];

  const formatMenuItems: MenuProps["items"] = [
    { key: "bold", icon: <BoldOutlined />, label: "Negrita", disabled: !selectedEl, onClick: () => updEl({ fontWeight: selectedEl?.fontWeight === "bold" ? "normal" : "bold" }) },
    { key: "italic", icon: <ItalicOutlined />, label: "Cursiva", disabled: !selectedEl, onClick: () => updEl({ fontStyle: (selectedEl as any)?.fontStyle === "italic" ? "normal" : "italic" } as any) },
    { key: "underline", icon: <UnderlineOutlined />, label: "Subrayado", disabled: !selectedEl, onClick: () => updEl({ textDecoration: (selectedEl as any)?.textDecoration === "underline" ? "none" : "underline" } as any) },
    { type: "divider" },
    { key: "alignLeft", icon: <AlignLeftOutlined />, label: "Alinear izquierda", disabled: !selectedEl, onClick: () => updEl({ align: "left" }) },
    { key: "alignCenter", icon: <AlignCenterOutlined />, label: "Alinear centro", disabled: !selectedEl, onClick: () => updEl({ align: "center" }) },
    { key: "alignRight", icon: <AlignRightOutlined />, label: "Alinear derecha", disabled: !selectedEl, onClick: () => updEl({ align: "right" }) },
    { type: "divider" },
    { key: "fontUp", icon: <FontSizeOutlined />, label: "Aumentar tamaño de fuente", disabled: !selectedEl, onClick: () => updEl({ fontSize: Math.min(24, (selectedEl?.fontSize ?? 11) + 1) }) },
    { key: "fontDown", icon: <FontSizeOutlined />, label: "Reducir tamaño de fuente", disabled: !selectedEl, onClick: () => updEl({ fontSize: Math.max(8, (selectedEl?.fontSize ?? 11) - 1) }) },
  ];

  const toolsMenuItems: MenuProps["items"] = [
    { key: "pageTicket", label: "Tamaño: Ticket (rollo)", onClick: () => { setPageSize("ticket"); markDirty(); } },
    { key: "pageLetter", label: "Tamaño: Carta", onClick: () => { setPageSize("letter"); markDirty(); } },
    { key: "pageHalf", label: "Tamaño: Media carta", onClick: () => { setPageSize("half-letter"); markDirty(); } },
    { type: "divider" },
    { key: "docSale", label: "Tipo: Venta / Factura", onClick: () => { setDocumentType("sale"); markDirty(); } },
    { key: "docQuotation", label: "Tipo: Cotización", onClick: () => { setDocumentType("quotation"); markDirty(); } },
    { type: "divider" },
    { key: "logo", label: logo ? "Cambiar logo" : "Agregar logo", onClick: () => logoInputRef.current?.click() },
    { key: "removeLogo", label: "Quitar logo", danger: true, disabled: !logo, onClick: () => { setLogo(null); markDirty(); } },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f0ede6", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      <div style={{ height: 28, background: "#3c3b38", display: "flex", alignItems: "center", padding: "0 10px", gap: 2, flexShrink: 0, borderBottom: "1px solid #222" }}>
        {[
          { label: "Archivo",      items: fileMenuItems },
          { label: "Edición",      items: editMenuItems },
          { label: "Ver",          items: viewMenuItems },
          { label: "Formato",      items: formatMenuItems },
          { label: "Herramientas", items: toolsMenuItems },
        ].map(({ label, items }) => (
          <Dropdown key={label} menu={{ items }} trigger={["click"]} placement="bottomLeft">
            <span style={{ padding: "2px 10px", fontSize: 12, color: "#ccc", cursor: "pointer", borderRadius: 3, lineHeight: "22px" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#555")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>{label}</span>
          </Dropdown>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "#777" }}>{currentTemplate ? `${currentTemplate.name}${isDirty ? " *" : ""}` : "Nueva plantilla"}</span>
      </div>

      <div style={{ background: "#e8e4da", borderBottom: "1px solid #ccc8bc", padding: "4px 10px", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
        <Select style={{ width: 190 }} size="small" placeholder="— Nueva plantilla —"
          value={currentTemplate?.id?.toString() ?? ""} onChange={handleSelectorChange} loading={loadingList}>
          <Option value="">— Nueva plantilla —</Option>
          {templates.map(t => (
            <Option key={t.id} value={t.id.toString()}>
              {t.isDefault ? <StarFilled style={{ color: "#faad14", fontSize: 10, marginRight: 4 }} /> : null}{t.name}
            </Option>
          ))}
        </Select>

        <Tooltip title="Cargar plantilla guardada">
          <Button size="small" icon={<FolderOpenOutlined />} onClick={() => { setLoadModalOpen(true); setSelectedLoadId(null); }} />
        </Tooltip>

        <input
          ref={importInputRef}
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: "none" }}
          onChange={handleImportFile}
        />

        <Tooltip title="Importar plantilla (.pdf)">
          <Button size="small" icon={<ImportOutlined />} onClick={() => importInputRef.current?.click()} />
        </Tooltip>

        <div style={{ width: 1, height: 20, background: "#c0bbb0", margin: "0 2px" }} />

        <Tooltip title="Agregar texto (doble clic para editar en el canvas)">
          <Button size="small" icon={<FontSizeOutlined />} onClick={addStaticText}>+ Texto</Button>
        </Tooltip>

        <div style={{ width: 1, height: 20, background: "#c0bbb0", margin: "0 2px" }} />

        <Tooltip title="Reducir zoom">
          <Button size="small" icon={<ZoomOutOutlined />} onClick={() => setZoom(z => Math.max(0.5, +(z - 0.1).toFixed(1)))} />
        </Tooltip>
        <span style={{ fontSize: 12, color: "#555", minWidth: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
        <Tooltip title="Aumentar zoom">
          <Button size="small" icon={<ZoomInOutlined />} onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1)))} />
        </Tooltip>

        <div style={{ width: 1, height: 20, background: "#c0bbb0", margin: "0 2px" }} />
        <span style={{ fontSize: 11, color: "#666" }}>Tamaño:</span>
        <Tooltip title="Tamaño de página para impresión">
          <Select
            size="small"
            style={{ width: 128 }}
            value={pageSize}
            onChange={(v: PageSize) => { setPageSize(v); markDirty(); }}
            options={[
              { value: "ticket",      label: "Ticket (rollo)" },
              { value: "letter",      label: "Carta" },
              { value: "half-letter", label: "Media carta" },
            ]}
          />
        </Tooltip>

        <div style={{ width: 1, height: 20, background: "#c0bbb0", margin: "0 2px" }} />
        <span style={{ fontSize: 11, color: "#666" }}>Tipo:</span>
        <Select
          size="small"
          style={{ width: 130 }}
          value={documentType}
          onChange={(v: 'sale' | 'quotation' | 'remission') => { setDocumentType(v); markDirty(); }}
          options={[
            { value: "sale",      label: "Venta / Factura" },
            { value: "quotation", label: "Cotización"      },
            { value: "remission", label: "Remisión"        },
          ]}
        />

        <div style={{ width: 1, height: 20, background: "#c0bbb0", margin: "0 2px" }} />
        <span style={{ fontSize: 11, color: "#666" }}>
          Alto {SECTIONS.find(s => s.id === activeSection)?.label.toLowerCase()}:
        </span>
        <Input
          size="small"
          type="number"
          style={{ width: 75 }}
          value={sectionHeights[activeSection]}
          min={SECTIONS.find(s => s.id === activeSection)?.minHeight ?? 40}
          max={600}
          onChange={e => {
            const min = SECTIONS.find(s => s.id === activeSection)?.minHeight ?? 40;
            setSectionHeight[activeSection](Number(e.target.value) || min);
            markDirty();
          }}
          suffix="px"
        />

        <div style={{ width: 1, height: 20, background: "#c0bbb0", margin: "0 2px" }} />

        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const input = e.target;
            try {
              const optimized = await resizeLogoDataUrl(file);
              setLogo(optimized);
              markDirty();
            } catch {
              message.error("No se pudo procesar la imagen del logo.");
            } finally {
              input.value = "";
            }
          }}
        />

        <Button size="small" onClick={() => logoInputRef.current?.click()}>
          {logo ? "Cambiar logo" : "+ Logo"}
        </Button>

        <div style={{ flex: 1 }} />

        {isDirty && <Tag color="warning" style={{ margin: 0 }}>● Sin guardar</Tag>}

        {isDirty && (
          <Button size="small" type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSaveChanges}>
              {currentTemplate ? "Guardar cambios" : "Guardar plantilla"}
          </Button>
        )}

        <Button size="small" icon={<SaveOutlined />} onClick={() => { saveForm.resetFields(); setSaveModalOpen(true); }}>
          Guardar como...
        </Button>
        <Tooltip title="Exportar plantilla actual (.pdf)">
          <Button size="small" icon={<ExportOutlined />} onClick={handleExportTemplate} />
        </Tooltip>
        <Tooltip title={previewMode ? "Salir de vista previa" : "Vista previa"}>
          <Button
            size="small"
            type={previewMode ? "primary" : "default"}
            icon={previewMode ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => {
              setPreviewMode(p => !p);
              setSelectedId(null); setSelectedColId(null);
              setEditingId(null); setEditingColId(null);
            }}
          />
        </Tooltip>
      </div>

      <div style={{ background: "#dedad0", borderBottom: "1px solid #ccc8bc", display: "flex", padding: "0 10px", flexShrink: 0 }}>
        {SECTIONS.map(s => (
          <div key={s.id} onClick={() => setActiveSection(s.id)} style={{
            padding: "5px 18px", fontSize: 12, cursor: "pointer",
            borderBottom: `2px solid ${activeSection === s.id ? "#1677ff" : "transparent"}`,
            color: activeSection === s.id ? "#1677ff" : "#666",
            fontWeight: activeSection === s.id ? 500 : 400, transition: "all .15s",
          }}>{s.label}</div>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        <div style={{ width: 178, flexShrink: 0, background: "#faf8f3", borderRight: "1px solid #d4cfc4", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "6px 10px", fontSize: 10, fontWeight: 700, color: "#777", borderBottom: "1px solid #e0dbd0", background: "#e8e4da", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Campos disponibles
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {FIELD_GROUPS.map(group => (
              <div key={group.id} style={{ borderBottom: "1px solid #ece8e0" }}>
                <div onClick={() => setOpenGroups(p => ({ ...p, [group.id]: !p[group.id] }))}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#444", background: "#f0ede6" }}>
                  <span style={{ fontSize: 9, color: "#aaa", transition: "transform .15s", display: "inline-block", transform: openGroups[group.id] ? "rotate(90deg)" : "none" }}>▶</span>
                  {group.label}
                </div>
                {openGroups[group.id] && group.fields.map(f => (
                  <div key={f.token} draggable onDragStart={() => onFieldDragStart(f.token, f.label)}
                    onDoubleClick={() => quickAddField(f.token, f.label, group.id === "partidas" ? "detail" : undefined)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px 4px 22px", fontSize: 12, color: "#555", cursor: "grab" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#e8e4dc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ fontSize: 10, color: "#ccc" }}>⬚</span>{f.label}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", background: "#a8a49c", padding: 20, display: "flex", justifyContent: "center", alignItems: "flex-start" }}
          onClick={() => { setSelectedId(null); setEditingId(null); }}>
          {loadingDetail ? (
            <div style={{ paddingTop: 80 }}><Spin tip="Cargando plantilla..." /></div>
          ) : (
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", flexShrink: 0 }}>
              <div style={{ width: DOC_W, height: 16, background: "#e8e4da", borderBottom: "1px solid #c8c4bc", display: "flex", alignItems: "flex-end", fontSize: 9, color: "#bbb", paddingLeft: 2 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} style={{ width: DOC_W / 10, flexShrink: 0 }}>{i * 56}</span>
                ))}
              </div>
              <div ref={docRef} style={{ width: DOC_W, background: "white", boxShadow: "0 3px 14px rgba(0,0,0,.25)" }}>
                {SECTIONS.map(sec => {
                  const secEls = elements.filter(e => e.section === sec.id);
                  const isActive = activeSection === sec.id;
                  return (
                    <div key={sec.id} 
                      style={{
                        position: "relative", minHeight: sectionHeights[sec.id],
                        background: previewMode ? "#fff" : (isActive ? sec.bgColor : "#f7f7f5"),
                        borderBottom: previewMode ? "none" : "2px dashed #d0c8b8",
                        opacity: previewMode ? 1 : (isActive ? 1 : 0.45), transition: "opacity .2s",
                      }}
                      onDragOver={e => !previewMode && isActive && e.preventDefault()}
                      onDrop={e => !previewMode && isActive && onSectionDrop(e, sec.id)}
                      onClick={e => { if (previewMode) return; e.stopPropagation(); setActiveSection(sec.id); }}
                    >

                      <div style={{ position: "absolute", right: 5, top: 2, fontSize: 9, color: isActive ? "#ccc" : "#e0e0e0", letterSpacing: "0.06em", pointerEvents: "none", zIndex: 20 }}>
                        {!previewMode && (sec.label)}
                      </div>

                      {sec.id !== "detail" && secEls.map(renderEl)}

                      {sec.id === "header" && logo && (
                        <img
                          src={logo}
                          alt="Logo"
                          onMouseDown={onLogoMouseDown}
                          style={{
                            position: "absolute",
                            left: logoX, top: logoY,
                            width: logoWidth, height: logoHeight,
                            objectFit: "contain",
                            cursor: "move",
                            userSelect: "none",
                            border: selectedId === "__logo__" ? "1px dashed #1677ff" : "none",
                            backgroundColor: logoBg !== "transparent" ? logoBg : undefined,
                            zIndex: 10,
                          }}
                        />
                      )}

                      {sec.id === "detail" && (
                        <div style={{ userSelect: "none" }}>
                          <div style={{ display: "flex", background: "#f0ece0", borderBottom: "1px solid #ccc", fontSize: 11, fontWeight: 600, color: "#444" }}>
                            {detailColumns.map((col) => {
                              const isFlex    = col.width === 0;
                              const isSelCol  = col.id === selectedColId;
                              const isEditHdr = col.id === editingColId;
                              return (
                                <div
                                  key={col.id}
                                  draggable={!isEditHdr}
                                  onDragStart={() => { if (!isEditHdr) dragColRef.current = col.id; }}
                                  onDragEnd={() => { dragColRef.current = null; }}
                                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                                  onDrop={e => {
                                    e.preventDefault(); e.stopPropagation();
                                    if (!dragColRef.current || dragColRef.current === col.id) return;
                                    setDetailColumns(prev => {
                                      const from = prev.findIndex(c => c.id === dragColRef.current);
                                      const to   = prev.findIndex(c => c.id === col.id);
                                      const next = [...prev];
                                      const [moved] = next.splice(from, 1);
                                      next.splice(to, 0, moved);
                                      return next;
                                    });
                                    dragColRef.current = null;
                                    markDirty();
                                  }}
                                  onClick={e => { e.stopPropagation(); setSelectedColId(col.id); setSelectedId(null); setActiveSection("detail"); }}
                                  onDoubleClick={e => { e.stopPropagation(); setSelectedColId(col.id); setEditingColId(col.id); setActiveSection("detail"); }}
                                  style={{
                                    width: isFlex ? undefined : col.width,
                                    flex: isFlex ? 2 : undefined,
                                    flexShrink: isFlex ? undefined : 0,
                                    padding: isEditHdr ? "1px 2px" : "4px 6px",
                                    textAlign: col.align,
                                    cursor: isEditHdr ? "text" : "grab",
                                    borderRight: "1px solid #d8d0c0",
                                    background: isEditHdr ? "rgba(255,255,200,0.9)" : isSelCol ? "rgba(22,119,255,0.12)" : undefined,
                                    outline: isSelCol ? `1px solid ${isEditHdr ? "#faad14" : "#1677ff"}` : undefined,
                                    outlineOffset: -1,
                                    position: "relative",
                                  }}>
                                  {isEditHdr ? (
                                    <input
                                      autoFocus
                                      value={col.header}
                                      onChange={e2 => { setDetailColumns(p => p.map(c => c.id === col.id ? { ...c, header: e2.target.value } : c)); markDirty(); }}
                                      onBlur={() => setEditingColId(null)}
                                      onKeyDown={e2 => { if (e2.key === "Enter" || e2.key === "Escape") setEditingColId(null); }}
                                      onClick={e2 => e2.stopPropagation()}
                                      onMouseDown={e2 => e2.stopPropagation()}
                                      style={{
                                        width: "100%", border: "none", background: "transparent", outline: "none",
                                        fontWeight: 600, fontSize: 11, color: "#333", padding: "3px 4px", cursor: "text",
                                      }}
                                    />
                                  ) : (
                                    <>
                                      {col.header}
                                      {isSelCol && isActive && (
                                        <div
                                          title="Eliminar columna"
                                          onClick={e => { e.stopPropagation(); setDetailColumns(p => p.filter(c => c.id !== col.id)); setSelectedColId(null); markDirty(); }}
                                          style={{ position: "absolute", top: 1, right: 2, fontSize: 9, color: "#f00", cursor: "pointer", lineHeight: 1 }}>✕</div>
                                      )}
                                      {isSelCol && isActive && (
                                        <div title="Doble clic para editar nombre" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "#faad14", opacity: 0.6, pointerEvents: "none" }} />
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            })}
                            {isActive && !previewMode && (
                              <div
                                onClick={e => {
                                  e.stopPropagation();
                                  const nc: DetailColumn = { id: genId(), header: "Nueva col.", token: "", width: 60, align: "right" };
                                  setDetailColumns(p => [...p, nc]);
                                  setSelectedColId(nc.id);
                                  setEditingColId(nc.id);
                                  markDirty();
                                }}
                                style={{ padding: "4px 8px", fontSize: 16, color: "#aaa", cursor: "pointer", flexShrink: 0, lineHeight: "16px" }}
                                title="Agregar columna">+</div>
                            )}
                          </div>

                          {!previewMode && (
                          <>
                            <div style={{ display: "flex", borderBottom: "1px dashed #ddd", background: "#fafaf8" }}>
                              {detailColumns.map(col => {
                                const isFlex   = col.width === 0;
                                const isSelCol = col.id === selectedColId;
                                const isEditTok = col.id + "_tok" === editingColId;
                                return (
                                  <div
                                    key={col.id}
                                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                                    onDrop={e => {
                                      e.preventDefault(); e.stopPropagation();
                                      const dragged = dragFieldRef.current;
                                      if (!dragged) return;
                                      dragFieldRef.current = null;
                                      setDetailColumns(prev => prev.map(c =>
                                        c.id === col.id
                                          ? { ...c, token: dragged.token, header: (c.header === "Nueva col." || c.header === "Col.") ? dragged.label : c.header }
                                          : c
                                      ));
                                      markDirty();
                                    }}
                                    onClick={e => { e.stopPropagation(); setSelectedColId(col.id); setSelectedId(null); setActiveSection("detail"); }}
                                    onDoubleClick={e => { e.stopPropagation(); setSelectedColId(col.id); setEditingColId(col.id + "_tok"); setActiveSection("detail"); }}
                                    style={{
                                      width: isFlex ? undefined : col.width,
                                      flex: isFlex ? 2 : undefined,
                                      flexShrink: isFlex ? undefined : 0,
                                      padding: isEditTok ? "1px 2px" : "3px 6px",
                                      textAlign: col.align,
                                      fontSize: col.fontSize ?? 11,
                                      fontFamily: "monospace",
                                      color: col.token ? "#555" : "#ccc",
                                      borderRight: "1px solid #ece8e0",
                                      background: isEditTok ? "rgba(255,255,200,0.9)" : isSelCol ? "rgba(22,119,255,0.06)" : undefined,
                                      outline: isSelCol ? `1px solid ${isEditTok ? "#faad14" : "#1677ff"}` : undefined,
                                      outlineOffset: -1,
                                      cursor: isEditTok ? "text" : "pointer",
                                      minHeight: 24,
                                      position: "relative",
                                    }}>
                                    {isEditTok ? (
                                      <input
                                        autoFocus
                                        value={col.token}
                                        onChange={e2 => { setDetailColumns(p => p.map(c => c.id === col.id ? { ...c, token: e2.target.value } : c)); markDirty(); }}
                                        onBlur={() => setEditingColId(null)}
                                        onKeyDown={e2 => { if (e2.key === "Enter" || e2.key === "Escape") setEditingColId(null); }}
                                        onClick={e2 => e2.stopPropagation()}
                                        onMouseDown={e2 => e2.stopPropagation()}
                                        placeholder="[Token]"
                                        style={{
                                          width: "100%", border: "none", background: "transparent", outline: "none",
                                          fontFamily: "monospace", fontSize: 11, color: "#333", padding: "3px 4px", cursor: "text",
                                        }}
                                      />
                                    ) : (
                                      col.token
                                        ? col.token
                                        : isActive
                                          ? <span style={{ color: "#bbb", fontSize: 10 }}>↓ arrastra · doble clic</span>
                                          : ""
                                    )}
                                  </div>
                                );
                              })}
                              {isActive && <div style={{ width: 26, flexShrink: 0 }} />}
                            </div>
                            <div style={{ padding: "4px 6px", fontSize: 10, color: "#ccc", fontStyle: "italic" }}>↕ Banda de repetición</div>
                          </>
                          )}

                          {previewMode && SAMPLE_DETAIL_ROWS.map((row, i) => (
                            <div key={i} style={{ display: "flex", borderBottom: "1px solid #eee" }}>
                              {detailColumns.map(col => {
                                const isFlex = col.width === 0;
                                return (
                                  <div key={col.id} style={{
                                    width: isFlex ? undefined : col.width,
                                    flex: isFlex ? 2 : undefined, flexShrink: isFlex ? undefined : 0,
                                    padding: "4px 6px", textAlign: col.align, fontSize: col.fontSize ?? 11,
                                  }}>
                                    {col.token ? (row[col.token] ?? "") : ""}
                                  </div>
                                );
                              })}
                            </div>
                          ))}

                          <div
                            style={{
                              position: "relative",
                              minHeight: 48,
                              borderTop: "1px dashed #e0dbd0",
                              background: isActive ? "rgba(240,236,224,0.3)" : "transparent",
                            }}
                            onDragOver={e => isActive && e.preventDefault()}
                            onDrop={e => {
                              if (!isActive) return;
                              e.preventDefault();
                              e.stopPropagation();
                              const dragged = dragFieldRef.current;
                              if (!dragged) return;
                              dragFieldRef.current = null;
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = Math.max(0, Math.round((e.clientX - rect.left) / zoom) - 40);
                              const y = Math.max(0, Math.round((e.clientY - rect.top) / zoom) - 10);
                              const newEl: ReportFieldElement = {
                                id: genId(), type: "field",
                                token: dragged.token,
                                label: dragged.label,
                                x, y, fontSize: 11, fontWeight: "normal", align: "left", section: "detail",
                              };
                              setElements(prev => [...prev, newEl]);
                              setSelectedId(newEl.id);
                              setSelectedColId(null);
                              markDirty();
                            }}
                          >
                            {secEls.map(renderEl)}
                            {isActive && secEls.length === 0 && !previewMode && (
                              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#ccc", pointerEvents: "none" }}>
                                Arrastra campos aquí para posición libre
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 188, flexShrink: 0, background: "#faf8f3", borderLeft: "1px solid #d4cfc4", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "6px 10px", fontSize: 10, fontWeight: 700, color: "#777", borderBottom: "1px solid #e0dbd0", background: "#e8e4da", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Propiedades
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {selectedId === "__logo__" ? (
              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={propLabel}>Imagen</div>
                </div>
                <div>
                  <div style={propLabel}>Tamaño</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#aaa", marginBottom: 2 }}>Ancho (px)</div>
                      <Input size="small" type="number" value={logoWidth} min={20} max={1500}
                        onChange={e => { setLogoWidth(Number(e.target.value) || 80); markDirty(); }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#aaa", marginBottom: 2 }}>Alto (px)</div>
                      <Input size="small" type="number" value={logoHeight} min={10} max={300}
                        onChange={e => { setLogoHeight(Number(e.target.value) || 60); markDirty(); }} />
                    </div>
                  </div>
                </div>
                <div>
                  <div style={propLabel}>Posición</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#aaa", marginBottom: 2 }}>X (px)</div>
                      <Input size="small" type="number" value={logoX}
                        onChange={e => { setLogoX(parseInt(e.target.value) || 0); markDirty(); }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#aaa", marginBottom: 2 }}>Y (px)</div>
                      <Input size="small" type="number" value={logoY}
                        onChange={e => { setLogoY(parseInt(e.target.value) || 0); markDirty(); }} />
                    </div>
                  </div>
                </div>
                <div>
                  <div style={propLabel}>Fondo</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Select
                      size="small"
                      style={{ flex: 1 }}
                      value={logoBg === "transparent" || !logoBg ? "transparent" : "color"}
                      onChange={val => { setLogoBg(val === "transparent" ? "transparent" : (logoBg === "transparent" ? "#ffffff" : logoBg)); markDirty(); }}
                      options={[
                        { value: "transparent", label: "Transparente" },
                        { value: "color",       label: "Color sólido" },
                      ]}
                    />
                    {logoBg !== "transparent" && logoBg && (
                      <input
                        type="color"
                        value={logoBg}
                        style={{ width: 32, height: 24, border: "none", padding: 0, cursor: "pointer", borderRadius: 4 }}
                        onChange={e => { setLogoBg(e.target.value); markDirty(); }}
                      />
                    )}
                  </div>
                </div>
                <Divider style={{ margin: "2px 0" }} />
                <Button size="small" danger icon={<DeleteOutlined />} block
                  onClick={() => { setLogo(null); setSelectedId(null); markDirty(); }}>
                  Eliminar logo
                </Button>
              </div>
            ) : activeSection === "detail" && selectedColId ? (() => {
              const col = detailColumns.find(c => c.id === selectedColId);
              if (!col) return null;
              const isFlex = col.width === 0;
              return (
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <div style={propLabel}>Encabezado</div>
                    <Input size="small" value={col.header} onChange={e => { setDetailColumns(p => p.map(c => c.id === col.id ? { ...c, header: e.target.value } : c)); markDirty(); }} />
                  </div>
                  <div>
                    <div style={propLabel}>Token</div>
                    <Input size="small" value={col.token} onChange={e => { setDetailColumns(p => p.map(c => c.id === col.id ? { ...c, token: e.target.value } : c)); markDirty(); }} style={{ fontFamily: "monospace", fontSize: 11 }} />
                  </div>
                  <div>
                    <div style={propLabel as any}>Ancho (px)</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Input size="small" type="number" disabled={isFlex} value={isFlex ? "" : col.width} onChange={e => { setDetailColumns(p => p.map(c => c.id === col.id ? { ...c, width: parseInt(e.target.value) || 60 } : c)); markDirty(); }} style={{ flex: 1 }} />
                      <Tooltip title={isFlex ? "Quitar flexible (fijar ancho)" : "Hacer columna flexible (ocupa espacio restante)"}>
                        <Button size="small" type={isFlex ? "primary" : "default"} onClick={() => { setDetailColumns(p => p.map(c => c.id === col.id ? { ...c, width: isFlex ? 80 : 0 } : c)); markDirty(); }}>flex</Button>
                      </Tooltip>
                    </div>
                  </div>
                  <div>
                    <div style={propLabel as any}>Alineación</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Tooltip title="Izquierda"><Button size="small" icon={<AlignLeftOutlined />} type={col.align === "left" ? "primary" : "default"} onClick={() => { setDetailColumns(p => p.map(c => c.id === col.id ? { ...c, align: "left" } : c)); markDirty(); }} /></Tooltip>
                      <Tooltip title="Centro"><Button size="small" icon={<AlignCenterOutlined />} type={col.align === "center" ? "primary" : "default"} onClick={() => { setDetailColumns(p => p.map(c => c.id === col.id ? { ...c, align: "center" } : c)); markDirty(); }} /></Tooltip>
                      <Tooltip title="Derecha"><Button size="small" icon={<AlignRightOutlined />} type={col.align === "right" ? "primary" : "default"} onClick={() => { setDetailColumns(p => p.map(c => c.id === col.id ? { ...c, align: "right" } : c)); markDirty(); }} /></Tooltip>
                    </div>
                  </div>
                  <div>
                  <div style={propLabel}>Tamaño de fuente</div>
                    <Select
                      size="small"
                      style={{ width: "100%" }}
                      value={col.fontSize ?? 9}
                      onChange={v => {
                        setDetailColumns(p => p.map(c => c.id === col.id ? { ...c, fontSize: v } : c));
                        markDirty();
                      }}
                    >
                      {[6, 7, 8, 9, 10, 11, 12, 13, 14].map(s => (
                        <Option key={s} value={s}>{s}px</Option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <div style={propLabel}>Texto multilínea</div>
                    <Checkbox
                      checked={col.wrap ?? false}
                      onChange={e => {
                        setDetailColumns(p => p.map(c => c.id === col.id ? { ...c, wrap: e.target.checked } : c));
                        markDirty();
                      }}
                    >
                      Permitir salto de línea
                    </Checkbox>
                  </div>

                  <Divider style={{ margin: "2px 0" }} />
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => { setDetailColumns(p => p.filter(c => c.id !== col.id)); setSelectedColId(null); markDirty(); }} block>Eliminar columna</Button>
                </div>
              );
            })() : <PropsPanel selectedEl={selectedEl} onUpdate={updEl} onDelete={deleteEl} />}
          </div>
        </div>
      </div>

      <div style={{ height: 22, background: "#3c3b38", display: "flex", alignItems: "center", padding: "0 12px", gap: 16, fontSize: 11, color: "#888", flexShrink: 0 }}>
        <span>{currentTemplate ? `Plantilla: ${currentTemplate.name}` : "Nueva plantilla"}</span>
        {selectedEl && <span>| {selectedEl.label} — ({selectedEl.x}, {selectedEl.y})</span>}
        <span style={{ marginLeft: "auto", color: isDirty ? "#f5a623" : "#5a9e5a" }}>{isDirty ? "● Cambios sin guardar" : "✓ Guardado"}</span>
      </div>

      <Modal title="Guardar plantilla" open={saveModalOpen} onCancel={() => setSaveModalOpen(false)} footer={null} destroyOnClose>
        <Form form={saveForm} layout="vertical" onFinish={handleSaveNew} style={{ marginTop: 8 }}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true, message: "Ingresa un nombre" }]}>
            <Input placeholder="Ej: Factura estándar" />
          </Form.Item>
          <Form.Item name="description" label="Descripción (opcional)">
            <Input.TextArea rows={2} placeholder="Describe para qué sirve..." />
          </Form.Item>
          <Form.Item name="isDefault" valuePropName="checked">
            <Checkbox>Establecer como plantilla por defecto</Checkbox>
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => setSaveModalOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>Guardar</Button>
          </div>
        </Form>
      </Modal>

      <Modal title="Cargar plantilla" open={loadModalOpen} onCancel={() => setLoadModalOpen(false)}
        onOk={handleConfirmLoad} okText="Cargar" cancelText="Cancelar"
        okButtonProps={{ disabled: !selectedLoadId, loading: loadingDetail }} destroyOnClose>
        {loadingList ? <div style={{ textAlign: "center", padding: 32 }}><Spin /></div>
          : templates.length === 0 ? <div style={{ textAlign: "center", padding: 32, color: "#aaa" }}>No hay plantillas guardadas.</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {templates.map(t => (
                <div key={t.id} onClick={() => setSelectedLoadId(t.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                  borderRadius: 8, cursor: "pointer", transition: "all .15s",
                  border: `1px solid ${selectedLoadId === t.id ? "#1677ff" : "#e5e7eb"}`,
                  background: selectedLoadId === t.id ? "#e6f4ff" : "white",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{t.name}</div>
                    {t.description && <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>{t.description}</div>}
                  </div>
                  {t.isDefault && <Tag color="success" style={{ fontSize: 10 }}>Default</Tag>}
                  <div style={{ display: "flex", gap: 2 }} onClick={e => e.stopPropagation()}>
                    <Tooltip title="Duplicar">
                      <Button size="small" type="text" icon={<CopyOutlined />}
                        onClick={() => { setDupTargetId(t.id); dupForm.setFieldValue("name", `Copia de ${t.name}`); setDupModalOpen(true); setLoadModalOpen(false); }} />
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <Button size="small" type="text" danger icon={<DeleteOutlined />} loading={deleting} onClick={() => handleDelete(t.id, t.name)} />
                    </Tooltip>
                    <Tooltip title={t.isDefault ? "Ya es predeterminada" : "Marcar como predeterminada"}>
                      <Button
                        size="small" type="text"
                        icon={t.isDefault ? <StarFilled style={{ color: "#faad14" }} /> : <StarOutlined />}
                        disabled={t.isDefault}
                        loading={saving}
                        onClick={() => handleSetDefault(t.id)}
                      />
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
      </Modal>

      <Modal title="Duplicar plantilla" open={dupModalOpen} onCancel={() => setDupModalOpen(false)} footer={null} destroyOnClose width={360}>
        <Form form={dupForm} layout="vertical" onFinish={handleDuplicate} style={{ marginTop: 8 }}>
          <Form.Item name="name" label="Nombre para la copia" rules={[{ required: true, message: "Ingresa un nombre" }]}>
            <Input placeholder="Copia de..." />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => setDupModalOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={duplicating} icon={<CopyOutlined />}>Duplicar</Button>
          </div>
        </Form>
      </Modal>

    </div>
  );
}