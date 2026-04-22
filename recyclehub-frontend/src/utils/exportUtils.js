import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToPDF = (title, columns, rows, filename) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(16, 185, 129);
  doc.text('RecycleHub', 14, 20);

  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text(title, 14, 30);

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);

  autoTable(doc, {
    startY: 44,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => row[c.key] ?? '—')),
    headStyles: { fillColor: [6, 78, 59], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    styles: { fontSize: 9, cellPadding: 4 },
  });

  doc.save(`${filename}-${Date.now()}.pdf`);
};

export const exportToExcel = (title, columns, rows, filename) => {
  const worksheetData = [
    columns.map((c) => c.label),
    ...rows.map((row) => columns.map((c) => row[c.key] ?? '')),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title.substring(0, 31));
  XLSX.writeFile(workbook, `${filename}-${Date.now()}.xlsx`);
};
