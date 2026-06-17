import jsPDF from "jspdf";
import pako from "pako";

export interface TemplateExportPayload {
  name: string;
  description?: string | null;
  config: any;
}

const START_MARK = "##TPLDATA_START##";
const END_MARK = "##TPLDATA_END##";
const CHARS_PER_LINE = 110;
const LINE_HEIGHT = 3.5;
const MARGIN_MM = 12;

function toBase64Compressed(value: string): string {
  const compressed = pako.deflate(value); // Uint8Array comprimido
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < compressed.length; i += CHUNK) {
    binary += String.fromCharCode(...compressed.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function fromBase64Compressed(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return pako.inflate(bytes, { to: "string" });
}

export function exportTemplateToPdf(
  payload: TemplateExportPayload,
  previewImageDataUrl: string,
  previewAspectRatio: number,
) {
  const imgWmm = 180;
  const imgHmm = imgWmm / previewAspectRatio;

  // Calcular el payload ANTES de crear el documento, para saber cuánto alto necesita la página
  const json = JSON.stringify({ name: payload.name, description: payload.description ?? "", config: payload.config });
  const b64 = toBase64Compressed(json);

  const totalLines = Math.ceil(b64.length / CHARS_PER_LINE) + 2;
  const hiddenBlockHmm = totalLines * LINE_HEIGHT + LINE_HEIGHT * 2; // colchón pequeño

  const pageWmm = imgWmm + MARGIN_MM * 2;
  const pageHmm = imgHmm + MARGIN_MM * 2 + hiddenBlockHmm;

  const doc = new jsPDF({
    unit: "mm",
    compress: false,
    format: [pageWmm, pageHmm],
  });

  doc.addImage(previewImageDataUrl, "PNG", MARGIN_MM, MARGIN_MM, imgWmm, imgHmm);

  // Datos ocultos en la MISMA página, debajo de la imagen — ya no se crea una segunda página
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  let y = imgHmm + MARGIN_MM * 2 + LINE_HEIGHT;
  doc.text(START_MARK, 10, y);
  y += LINE_HEIGHT;
  for (let i = 0; i < b64.length; i += CHARS_PER_LINE) {
    doc.text(b64.slice(i, i + CHARS_PER_LINE), 10, y);
    y += LINE_HEIGHT;
  }
  doc.text(END_MARK, 10, y);

  const safeName = (payload.name || "plantilla").trim().replace(/\s+/g, "_").toLowerCase();
  doc.save(`plantilla-${safeName}.pdf`);
}

export async function importTemplateFromPdf(file: File): Promise<TemplateExportPayload> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let raw = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    raw += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }

  const startIdx = raw.indexOf(START_MARK);
  const endIdx = raw.indexOf(END_MARK);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error("invalid_pdf_template");
  }

  const segment = raw.slice(startIdx + START_MARK.length, endIdx);
  const matches = segment.match(/\(([A-Za-z0-9+/=]+)\)/g) ?? [];
  const b64 = matches.map((m) => m.slice(1, -1)).join("");
  if (!b64) throw new Error("invalid_pdf_template");

  const parsed = JSON.parse(fromBase64Compressed(b64));
  if (!parsed?.config) throw new Error("invalid_pdf_template");
  return parsed as TemplateExportPayload;
}