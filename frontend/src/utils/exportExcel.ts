import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

export function exportProfitReportToExcel(
  summary: any,
  details: any[],
  from: string,
  to: string
) {
  const workbook = XLSX.utils.book_new();

  const headerRows = [
    ["REPORTE DE UTILIDAD DE VENTAS"],
    [`Periodo: ${from} - ${to}`],
    [],
    ["Ventas Totales", summary?.totalSales ?? 0],
    ["Costo Total", summary?.totalCogs ?? 0],
    ["Utilidad Bruta", summary?.totalProfit ?? 0],
    ["Margen %", summary?.margin ?? 0],
    [],
  ];

  const tableHeader = [
    "Venta",
    "Fecha",
    "Cliente",
    "Vendedor",
    "Total",
    "Costo",
    "Utilidad",
    "Margen %",
  ];

  const tableRows = details.map((row) => [
    row.saleNumber,
    dayjs(row.date).format("DD/MM/YYYY HH:mm"),
    row.customer,
    row.seller,
    Number(row.total ?? 0),
    Number(row.cogs ?? 0),
    Number(row.profit ?? 0),
    Number(row.margin ?? 0),
  ]);

  const totalRow = [
    "TOTAL GENERAL",
    "",
    "",
    "",
    summary?.totalSales ? Number(summary.totalSales) : 0,
    summary?.totalCogs ?? 0,
    summary?.totalProfit ?? 0,
    summary?.margin ?? 0,
  ];

  const sheetData = [
    ...headerRows,
    tableHeader,
    ...tableRows,
    totalRow,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  worksheet["!cols"] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
  ];

  if (!worksheet["!ref"]) return;

  const range = XLSX.utils.decode_range(worksheet["!ref"] || "");

  const startRow = headerRows.length + 1;

  for (let R = startRow; R <= range.e.r; R++) {
    const totalCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 4 })];
    const costCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 5 })];
    const profitCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 6 })];
    const marginCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 7 })];

    if (totalCell?.v !== undefined) {
      totalCell.t = "n";
      totalCell.z = '"L "#,##0.00';
    }

    if (costCell?.v !== undefined) {
      costCell.t = "n";
      costCell.z = '"L "#,##0.00';
    }

    if (profitCell?.v !== undefined) {
      profitCell.t = "n";
      profitCell.z = '"L "#,##0.00';
    }

    if (marginCell?.v !== undefined) {
      marginCell.t = "n";
      marginCell.z = '0.00"%"';
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Utilidad");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  const fileName = `Reporte_Utilidad_${from}_${to}.xlsx`;

  saveAs(blob, fileName);
}

export function exportKardexToExcel(
  data: any[],
  productName: string,
  from: string,
  to: string
) {
  const workbook = XLSX.utils.book_new();

  const headers = [
    "Fecha",
    "Tipo",
    "Referencia",
    "Entrada",
    "Salida",
    "Saldo Cantidad",
    "Saldo Valor",
  ];

  const rows = data.map((row) => ({
    Fecha: dayjs(row.date).format("DD/MM/YYYY HH:mm"),
    Tipo: row.type === "IN" ? "Entrada" : "Salida",
    Referencia: row.reference,
    Entrada: row.type === "IN" ? row.quantity : "",
    Salida: row.type === "OUT" ? row.quantity : "",
    "Saldo Cantidad": row.balance_qty,
    "Saldo Valor": row.balance_value,
  }));

  if (data.length) {
    const last = data[data.length - 1];

    rows.push({
      Fecha: "",
      Tipo: "",
      Referencia: "SALDO FINAL",
      Entrada: "",
      Salida: "",
      "Saldo Cantidad": last.balance_qty,
      "Saldo Valor": last.balance_value,
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: headers,
    skipHeader: false,
  });

  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
  ];

  const range = XLSX.utils.decode_range(worksheet["!ref"] || "");

  for (let R = 1; R <= range.e.r; R++) {
    const saldoValorCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 6 })];
    if (saldoValorCell && typeof saldoValorCell.v === "number") {
      saldoValorCell.t = "n";
      saldoValorCell.z = '"L "#,##0.00';
    }

    const entradaCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 3 })];
    if (entradaCell && typeof entradaCell.v === "number") {
      entradaCell.t = "n";
      entradaCell.z = "#,##0.00";
    }

    const salidaCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 4 })];
    if (salidaCell && typeof salidaCell.v === "number") {
      salidaCell.t = "n";
      salidaCell.z = "#,##0.00";
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, "Kardex");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  const fileName = `Kardex_${productName}_${from}_${to}.xlsx`;

  saveAs(blob, fileName);
}

export function exportToExcel<T>(
  rows: T[],
  fileName: string,
  sheetName = "Reporte"
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `${fileName}.xlsx`);
}