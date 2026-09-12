import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import type { BankStatement } from "../types/bank";

export function exportBankStatementToExcel(
  statement: BankStatement,
  from: string,
  to: string
) {
  const { bank, initialBalance, finalBalance, currentBalance, rows } = statement;

  const workbook = XLSX.utils.book_new();

  const titleBlock = [
    [],
    [null, null, null, null, "DETALLE DE MOVIMIENTOS DEL PERÍODO"],
    [],
  ];

  const infoBlock = [
    ["Nombre", bank.name, null, null, null, null, null, "Saldo Inicial", null, initialBalance],
    ["Banco", bank.bankName ?? "-", null, null, null, bank.currency, null, "Saldo en Libros", null, currentBalance],
    ["No. Cuenta", bank.accountNumber ?? "-", null, null, null, null, null, "Saldo Disponible", null, finalBalance],
    ["Periodo", `${dayjs(from).format("DD/MM/YYYY")} - ${dayjs(to).format("DD/MM/YYYY")}`],
    [],
  ];

  const headerRows = [...titleBlock, ...infoBlock];
  const infoStartRow = titleBlock.length;

  const tableHeader = [
    "Fecha",
    "Referencia",
    "Código",
    "Descripción",
    "Débitos",
    "Créditos",
    "Balance",
  ];

  const initialRow = ["", "", "", "Saldo Inicial", "", "", initialBalance];

  const tableRows = rows.map((r) => [
    dayjs(r.date).format("DD/MM/YYYY"),
    r.reference ?? "",
    r.code,
    r.description,
    r.debit || "",
    r.credit || "",
    r.balance,
  ]);

  const finalRow = ["", "", "", "Saldo Final", "", "", finalBalance];

  const sheetData = [
    ...headerRows,
    tableHeader,
    initialRow,
    ...tableRows,
    finalRow,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 10 },
    { wch: 40 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
  ];

  // Formatear los saldos del encabezado (columna J = índice 9)
  [infoStartRow, infoStartRow + 1, infoStartRow + 2].forEach((R) => {
    const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: 9 })];
    if (cell && typeof cell.v === "number") {
      cell.t = "n";
      cell.z = '"L "#,##0.00';
    }
  });

  // Formatear Débitos/Créditos/Balance de la tabla
  const tableHeaderRow = headerRows.length;
  const initialRowIndex = tableHeaderRow + 1;
  const finalRowIndex = initialRowIndex + 1 + tableRows.length;

  for (let R = initialRowIndex; R <= finalRowIndex; R++) {
    [4, 5, 6].forEach((C) => {
      const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell && typeof cell.v === "number") {
        cell.t = "n";
        cell.z = '"L "#,##0.00';
      }
    });
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, "Movimientos");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  saveAs(blob, `Movimientos_${bank.name}_${from}_${to}.xlsx`);
}

export function exportBankStatementToPdf(
  statement: BankStatement,
  from: string,
  to: string
) {
  const { bank, initialBalance, finalBalance, currentBalance, rows } = statement;

  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Detalle de Movimientos del Período", 14, 15);

  doc.setFontSize(9);
  doc.text(`Cuenta: ${bank.name}${bank.bankName ? " - " + bank.bankName : ""}`, 14, 23);
  doc.text(`No. Cuenta: ${bank.accountNumber ?? "-"}`, 14, 28);
  doc.text(
    `Periodo: ${dayjs(from).format("DD/MM/YYYY")} - ${dayjs(to).format("DD/MM/YYYY")}`,
    14,
    33
  );

  doc.text(`Saldo Inicial: L ${initialBalance.toFixed(2)}`, 140, 23);
  doc.text(`Saldo en Libros: L ${currentBalance.toFixed(2)}`, 140, 28);
  doc.text(`Saldo Disponible: L ${finalBalance.toFixed(2)}`, 140, 33);

  const body = [
    ["", "", "", "Saldo Inicial", "", "", initialBalance.toFixed(2)],
    ...rows.map((r) => [
      dayjs(r.date).format("DD/MM/YYYY"),
      r.reference ?? "",
      r.code,
      r.description,
      r.debit ? r.debit.toFixed(2) : "",
      r.credit ? r.credit.toFixed(2) : "",
      r.balance.toFixed(2),
    ]),
    ["", "", "", "Saldo Final", "", "", finalBalance.toFixed(2)],
  ];

  autoTable(doc, {
    startY: 38,
    head: [["Fecha", "Referencia", "Código", "Descripción", "Débitos", "Créditos", "Balance"]],
    body,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 119, 255] },
    columnStyles: {
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
  });

  doc.save(`Movimientos_${bank.name}_${from}_${to}.pdf`);
}