// Tipos para el diseñador de reportes de ventas

export interface ReportFieldElement {
  id: string;
  type: "field" | "static";
  token: string;       // ej: "[NombreCliente]"
  label: string;       // ej: "Nombre del cliente"
  x: number;
  y: number;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  align?: "left" | "center" | "right";
  section: "header" | "detail" | "totals" | "footer";
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
  columns: ReportColumn[];
  filters: ReportFilter[];
  header: ReportHeader;
  groupBy?: "seller" | "customer" | "paymentMethod" | "date" | "product" | "";
  totals: {
    showSubtotal: boolean;
    showDiscount: boolean;
    showTotal: boolean;
    showCommission: boolean;
  };
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

export enum ReportTemplateError {
  NOT_FOUND = "REPORT_TEMPLATE_NOT_FOUND",
  NAME_TAKEN = "REPORT_TEMPLATE_NAME_TAKEN",
}