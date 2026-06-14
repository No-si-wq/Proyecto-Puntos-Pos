import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button, Select, Input, Checkbox, Modal, Form,
  message, Spin, Tooltip, Tag, Divider,
} from "antd";
import {
  SaveOutlined, FolderOpenOutlined, CopyOutlined, DeleteOutlined,
  StarFilled, StarOutlined, BoldOutlined, ItalicOutlined, UnderlineOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined,
  ZoomInOutlined, ZoomOutOutlined, EyeOutlined, FontSizeOutlined,
} from "@ant-design/icons";
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
    { token: "[Factura]",      label: "# Factura" },
    { token: "[Fecha]",        label: "Fecha" },
    { token: "[Estatus]",      label: "Estatus" },
    { token: "[MetodoPago]",   label: "Método de pago" },
    { token: "[ListaPrecios]", label: "Lista de precios" },
    { token: "[Monto]",   label: "Monto" },
    { token: "[Cambio]", label: "Cambio" },
    { token: "[Observaciones]", label: "Observaciones" },
  ]},
  { id: "cliente", label: "Cliente", fields: [
    { token: "[NombreCliente]",    label: "Nombre del cliente" },
    { token: "[DireccionCliente]", label: "Dirección" },
    { token: "[CiudadCliente]",    label: "Ciudad" },
    { token: "[DNI]",              label: "DNI" },
    { token: "[TelefonoCliente]",    label: "Telefono" },
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
    { token: "[Impuesto]",   label: "Impuesto" },
    { token: "[Importe]",     label: "Importe" },
    { token: "[Totales]",     label: "Totales" },
    { token: "[Comision]",    label: "Comisión línea" },
  ]},
  { id: "totales", label: "Totales", fields: [
    { token: "[Subtotal]",      label: "Subtotal" },
    { token: "[DescTotal]",     label: "Descuento total" },
    { token: "[ImpTotal]",     label: "Impuestos" },
    { token: "[Total]",         label: "Total" },
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

function genId() { return "el_" + Math.random().toString(36).slice(2, 8); }

const DOC_W = 560;

type CanvasElement = ReportFieldElement & { width?: number };


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
  const [openGroups,      setOpenGroups]      = useState<Record<string, boolean>>({ cliente: true, partidas: true });

  const [detailColumns,   setDetailColumns]  = useState<DetailColumn[]>(DEFAULT_DETAIL_COLUMNS);
  const [selectedColId,  setSelectedColId]  = useState<string | null>(null);
  const dragColRef = useRef<string | null>(null);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [pageSize,       setPageSize]       = useState<PageSize>("ticket");
  const [headerHeight, setHeaderHeight] = useState<number>(130);
  const [logo,       setLogo]       = useState<string | null>(null);
  const [logoX,      setLogoX]      = useState(8);
  const [logoY,      setLogoY]      = useState(8);
  const [logoWidth,  setLogoWidth]  = useState(80);
  const [logoHeight, setLogoHeight] = useState(60);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const draggingLogoRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [documentType,   setDocumentType]   = useState<'sale' | 'quotation'>('sale');

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

  useEffect(() => {
    let ignore = false;
    getDefaultCancellable(ignore).then(t => { if (!ignore && t) applyTemplate(t, false); });
    return () => { ignore = true; };
  }, []);

  function applyTemplate(t: ReportTemplate, showMessage = true) {
    setCurrentTemplate(t);
    setElements((t.config.elements?.length ? t.config.elements : DEFAULT_ELEMENTS) as CanvasElement[]);
    setDetailColumns(t.config.detailColumns?.length ? t.config.detailColumns : DEFAULT_DETAIL_COLUMNS);
    setPageSize(t.config.pageSize ?? "ticket");
    setHeaderHeight(t.config.headerHeight ?? 130);
    setDocumentType((t.config as any).documentType ?? "sale");
    setIsDirty(false);
    setSelectedId(null);
    setSelectedColId(null);
    setLogo(t.config.logoBase64 ?? null);
    setLogoX(t.config.logoX ?? 8);
    setLogoY(t.config.logoY ?? 8);
    setLogoWidth(t.config.logoWidth ?? 80);
    setLogoHeight(t.config.logoHeight ?? 60);
    if (showMessage) message.success(`Plantilla "${t.name}" cargada`);
  }

  function markDirty() { setIsDirty(true); }

  function buildConfig(): ReportTemplateConfig {
    const base = currentTemplate?.config ?? DEFAULT_CONFIG;
    return { 
      ...base, elements, detailColumns, pageSize, documentType, headerHeight, 
      logoBase64: logo ?? undefined,
      logoX, logoY, logoWidth, logoHeight,
    };
  }

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
    setSelectedId(null);
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
      setCurrentTemplate(null); setElements(DEFAULT_ELEMENTS); setIsDirty(false); setSelectedId(null); return;
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

  function renderEl(el: CanvasElement) {
    const isSel = el.id === selectedId;
    const isEditing = el.id === editingId;
    const elWidth = el.width;

    return (
      <div
        key={el.id}
        onMouseDown={e => onElMouseDown(e, el.id)}
        onDoubleClick={e => {
          e.stopPropagation();
          setSelectedId(el.id);
          if (el.type === "static") setEditingId(el.id);
        }}
        style={{
          position: "absolute", left: el.x, top: el.y,
          cursor: isEditing ? "text" : "move",
          userSelect: "none", padding: "1px 3px",
          border: `1px dashed ${isSel ? "#1677ff" : "transparent"}`,
          background: isSel ? "rgba(22,119,255,0.07)" : "transparent",
          zIndex: isSel ? 10 : 2, minWidth: 30,
          width: elWidth ? elWidth : undefined,
        }}
      >
        {el.type === "field" ? (
          <>
            <div style={{ fontSize: 9, color: "#bbb", lineHeight: 1.2, pointerEvents: "none" }}>{el.label}</div>
            <div style={{ fontSize: el.fontSize ?? 11, fontWeight: el.fontWeight ?? "normal", fontFamily: "monospace", color: "#333", pointerEvents: "none" }}>{el.token}</div>
          </>
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
          <div
            title="Doble clic para editar"
            style={{
              fontSize: el.fontSize ?? 12,
              fontWeight: el.fontWeight ?? "normal",
              color: "#222",
              pointerEvents: "none",
              whiteSpace: "pre-wrap",
              textAlign: (el.align as any) ?? "left",
            }}
          >{el.label}</div>
        )}
        {isSel && !isEditing && (
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f0ede6", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      <div style={{ height: 28, background: "#3c3b38", display: "flex", alignItems: "center", padding: "0 10px", gap: 2, flexShrink: 0, borderBottom: "1px solid #222" }}>
        {["Archivo", "Edición", "Ver", "Formato", "Herramientas"].map(m => (
          <span key={m} style={{ padding: "2px 10px", fontSize: 12, color: "#ccc", cursor: "pointer", borderRadius: 3, lineHeight: "22px" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#555")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>{m}</span>
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
          onChange={(v: 'sale' | 'quotation') => { setDocumentType(v); markDirty(); }}
          options={[
            { value: "sale",      label: "Venta / Factura" },
            { value: "quotation", label: "Cotización"      },
          ]}
        />

        <div style={{ width: 1, height: 20, background: "#c0bbb0", margin: "0 2px" }} />
        <span style={{ fontSize: 11, color: "#666" }}>Alto encabezado:</span>
        <Input
          size="small"
          type="number"
          style={{ width: 75 }}
          value={headerHeight}
          min={80}
          max={600}
          onChange={e => { setHeaderHeight(Number(e.target.value) || 130); markDirty(); }}
          suffix="px"
        />

        <div style={{ width: 1, height: 20, background: "#c0bbb0", margin: "0 2px" }} />

        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
              setLogo(ev.target?.result as string);
              markDirty();
            };
            reader.readAsDataURL(file);
            e.target.value = "";
          }}
        />

        <Button size="small" onClick={() => logoInputRef.current?.click()}>
          {logo ? "Cambiar logo" : "+ Logo"}
        </Button>

        {logo && (
          <>
            <Input
              size="small" type="number" style={{ width: 75 }}
              value={logoWidth} min={20} max={400}
              onChange={e => { setLogoWidth(Number(e.target.value) || 80); markDirty(); }}
              suffix="w"
            />
            <Input
              size="small" type="number" style={{ width: 58 }}
              value={logoHeight} min={10} max={300}
              onChange={e => { setLogoHeight(Number(e.target.value) || 60); markDirty(); }}
              suffix="h"
            />
            <Button size="small" danger onClick={() => { setLogo(null); markDirty(); }}>✕</Button>
          </>
        )}

        <div style={{ flex: 1 }} />

        {isDirty && <Tag color="warning" style={{ margin: 0 }}>● Sin guardar</Tag>}

        <Button size="small" type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSaveChanges}>
            {currentTemplate ? "Guardar cambios" : "Guardar plantilla"}
          </Button>
        <Button size="small" icon={<SaveOutlined />} onClick={() => { saveForm.resetFields(); setSaveModalOpen(true); }}>
          Guardar como...
        </Button>
        <Tooltip title="Vista previa">
          <Button size="small" icon={<EyeOutlined />} />
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
              <div style={{ width: DOC_W, background: "white", boxShadow: "0 3px 14px rgba(0,0,0,.25)" }}>
                {SECTIONS.map(sec => {
                  const secEls = elements.filter(e => e.section === sec.id);
                  const isActive = activeSection === sec.id;
                  return (
                    <div key={sec.id} style={{
                      position: "relative", minHeight: sec.id === "header" ? headerHeight : sec.minHeight,
                      background: isActive ? sec.bgColor : "#f7f7f5",
                      borderBottom: "2px dashed #d0c8b8",
                      opacity: isActive ? 1 : 0.45, transition: "opacity .2s",
                    }}
                      onDragOver={e => isActive && e.preventDefault()}
                      onDrop={e => isActive && onSectionDrop(e, sec.id)}
                      onClick={e => { e.stopPropagation(); setActiveSection(sec.id); }}>

                      <div style={{ position: "absolute", right: 5, top: 2, fontSize: 9, color: isActive ? "#ccc" : "#e0e0e0", letterSpacing: "0.06em", pointerEvents: "none", zIndex: 20 }}>
                        {sec.label}
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
                            border: activeSection === "header" ? "1px dashed #1677ff" : "none",
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
                            {isActive && (
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
                            {isActive && secEls.length === 0 && (
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
            {activeSection === "detail" && selectedColId ? (() => {
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