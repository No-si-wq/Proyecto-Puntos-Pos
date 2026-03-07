import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PdfColumn {
  header: string;
  dataKey: string;
}

export function exportToPdf(
  title: string,
  columns: PdfColumn[],
  rows: any[],
  fileName: string
) {
  const doc = new jsPDF();

  doc.text(title, 14, 15);

  autoTable(doc, {
    startY: 20,
    columns,
    body: rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 119, 255] },
  });

  doc.save(`${fileName}.pdf`);
}
