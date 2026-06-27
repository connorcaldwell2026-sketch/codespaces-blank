import { stringify } from 'csv-stringify';
import PDFDocument from 'pdfkit';

export const streamCsv = (res, rows) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="reports.csv"');
  const stringifier = stringify({ header: true, columns: Object.keys(rows[0] || {}) });
  stringifier.pipe(res);
  rows.forEach((row) => stringifier.write(row));
  stringifier.end();
};

export const streamPdfReport = (res, title, items) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="crime-report.pdf"');
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(res);
  doc.fontSize(20).text(title, { underline: true });
  doc.moveDown();
  items.forEach((item) => {
    doc.fontSize(12).text(item);
    doc.moveDown(0.5);
  });
  doc.end();
};

export default { streamCsv, streamPdfReport };
