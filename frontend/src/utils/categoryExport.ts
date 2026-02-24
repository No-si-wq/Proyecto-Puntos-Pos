import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { Category } from "../types/category";

function buildCategoryRowsByLevel(categories: Category[]) {
  const rows: { path: string[] }[] = [];
  let maxDepth = 0;

  function traverse(
    nodes: Category[],
    path: string[] = []
  ) {
    for (const node of nodes) {
      if (!node.active) continue;

      const newPath = [...path, node.name];
      maxDepth = Math.max(maxDepth, newPath.length);

      rows.push({ path: newPath });

      if (node.children?.length) {
        traverse(node.children, newPath);
      }
    }
  }

  traverse(categories);

  const formattedRows = rows.map(({ path }) => {
    const row: Record<string, string> = {};

    for (let i = 0; i < maxDepth; i++) {
      row[`Nivel ${i + 1}`] = path[i] ?? "";
    }

    return row;
  });

  return { rows: formattedRows, maxDepth };
}

export function exportCategoriesToExcel(categories: Category[]) {
  const { rows } = buildCategoryRowsByLevel(categories);

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Categorias");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, "Categorias.xlsx");
}

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportCategoriesToPDF(categories: Category[]) {
  const { rows, maxDepth } = buildCategoryRowsByLevel(categories);

  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Reporte de Categorías", 14, 15);

  const headers = [
    ...Array.from({ length: maxDepth }, (_, i) => `Nivel ${i + 1}`),
  ];

  const body = rows.map(r =>
    headers.map(h => r[h] ?? "")
  );

  autoTable(doc, {
    startY: 25,
    head: [headers],
    body,
  });

  doc.save("Categorias.pdf");
}

export function parseCategoriesExcel(file: File) {
  return new Promise<string[][]>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const json = XLSX.utils.sheet_to_json<string[]>(sheet, {
          header: 1,
          blankrows: false,
        });

        const rows = json.slice(1);

        const cleanRows = rows
          .map(r => r.filter(Boolean))
          .filter(r => r.length > 0);

        resolve(cleanRows);
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsArrayBuffer(file);
  });
}