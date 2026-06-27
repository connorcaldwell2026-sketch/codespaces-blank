import express from 'express';
import { stringify } from 'csv-stringify';
import PDFDocument from 'pdfkit';
import Report from '../models/Report.js';

const router = express.Router();

router.get('/csv', async (req, res) => {
  const regionId = req.query.regionId || process.env.REGION_DEFAULT || 'default';
  const crimeType = req.query.crimeType;
  const since = req.query.since ? new Date(req.query.since) : new Date(0);
  const filter = { regionId, createdAt: { $gte: since } };
  if (crimeType) filter.crimeType = crimeType;
  try {
    const reports = await Report.find(filter).lean();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="reports.csv"');
    const columns = ['_id', 'crimeType', 'severity', 'status', 'verified', 'createdAt', 'location.coordinates'];
    const stringifier = stringify({ header: true, columns });
    stringifier.pipe(res);
    reports.forEach((report) => {
      stringifier.write({
        _id: report._id.toString(),
        crimeType: report.crimeType,
        severity: report.severity,
        status: report.status,
        verified: report.verified,
        createdAt: report.createdAt,
        'location.coordinates': report.location?.coordinates?.join(',')
      });
    });
    stringifier.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'CSV export failed' });
  }
});

router.get('/pdf', async (req, res) => {
  const regionId = req.query.regionId || process.env.REGION_DEFAULT || 'default';
  try {
    const reports = await Report.find({ regionId }).sort({ createdAt: -1 }).limit(50).lean();
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="crime-report.pdf"');
    doc.pipe(res);
    doc.fontSize(20).text('SafeMap Crime Summary Report', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Region: ${regionId}`);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();
    reports.forEach((report) => {
      doc.fontSize(11).text(`- ${report.crimeType} | Severity: ${report.severity} | Status: ${report.status} | ${new Date(report.createdAt).toLocaleString()}`);
      doc.text(`  ${report.description}`);
      doc.moveDown(0.5);
    });
    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'PDF export failed' });
  }
});

export default router;
