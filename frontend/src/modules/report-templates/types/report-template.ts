 export interface ReportFieldElement {
  id: string;
  type: "field" | "static" | "divider";
  token: string;        
  label: string;        
  x: number;
  y: number;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  color?: string;
  align?: "left" | "center" | "right";
  section: "header" | "detail" | "totals" | "footer";
  width?: number;                 // largo de la línea (también usado por el canvas para el ancho de texto)
  dividerStyle?: "solid" | "dashed" | "double";
}

export type PageSize =
  | "ticket"      
  | "letter"      
  | "half-letter" 
  | "custom";     

export interface DetailColumn {
  id: string;
  header: string;
  token: string;
  width: number;         
  align: "left" | "center" | "right";
  fontSize?: number;
  wrap?: boolean;
}

// agregar junto a DetailColumn
export interface DetailLineField {
  token: string;
  label?: string;
  align: "left" | "center" | "right";
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  wrap?: boolean;
}

export interface DetailLine {
  id: string;
  fields: DetailLineField[];
}

export interface ReportColumn {
  key: string;
  label: string;
  type: "text" | "currency" | "date" | "number" | "status";
  width?: number;
  align?: "left" | "center" | "right";
}

export interface ReportFilter {
  field: string;
  op: "eq" | "gte" | "lte" | "contains";
  value: string;
}

export interface ReportHeader {
  company: string;
  title: string;
  period?: string;
  showDate: boolean;
  showSeller: boolean;
  showStatus: boolean;
  showPage: boolean;
}

export interface ReportTemplateConfig {
  elements: ReportFieldElement[];
  detailColumns?: DetailColumn[];
  columns: ReportColumn[];
  filters: ReportFilter[];
  header: ReportHeader;
  pageSize?: PageSize;
  customPageWidth?: number;   
  customPageHeight?: number;
  headerHeight?: number;
  detailHeight?: number;
  totalsHeight?: number;
  footerHeight?: number;
  logoBase64?: string;
  logoX?: number;
  logoY?: number;
  logoWidth?: number;
  logoHeight?: number;
  logoBackground?: string;  
  documentType?: 'sale' | 'quotation' | 'remission' | 'receivable_payment';
  groupBy?: "seller" | "customer" | "paymentMethod" | "date" | "product" | "";
  detailLayout?: "table" | "stacked";  // "table" = comportamiento actual, "stacked" = ticket
  detailLines?: DetailLine[];    
  totals: {
    showSubtotal: boolean;
    showDiscount: boolean;
    showTotal: boolean;
    showCommission: boolean;
  };
}

export interface ReportTemplateMeta {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportTemplate extends ReportTemplateMeta {
  config: ReportTemplateConfig;
}

export interface CreateReportTemplateInput {
  name: string;
  description?: string;
  config: ReportTemplateConfig;
  isDefault?: boolean;
}

export interface UpdateReportTemplateInput {
  name?: string;
  description?: string;
  config?: ReportTemplateConfig;
  isDefault?: boolean;
}