import express from 'express';
import Report from '../models/Report.js';
import PatternAnalysis from '../models/PatternAnalysis.js';
import TrendAlert from '../models/TrendAlert.js';

const router = express.Router();

router.get('/overview', async (req, res) => {
  const regionId = req.query.regionId || process.env.REGION_DEFAULT || 'default';
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthReports = await Report.countDocuments({ regionId, createdAt: { $gte: thirtyDaysAgo } });
    const responseTimeAgg = await Report.aggregate([
      { $match: { regionId, resolvedAt: { $exists: true } } },
      { $project: { resolutionHours: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60] } } },
      { $group: { _id: null, avgResolution: { $avg: '$resolutionHours' } } }
    ]);
    const sosCount = await Report.countDocuments({ regionId, isEmergency: true, createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } });
    const topCrime = await Report.aggregate([
      { $match: { regionId } },
      { $group: { _id: '$crimeType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const briefing = await PatternAnalysis.findOne({ regionId }).sort({ generatedAt: -1 }).lean();
    res.json({
      totalReportsThisMonth: monthReports,
      avgResolutionTimeHours: responseTimeAgg[0]?.avgResolution || 0,
      sosIncidentsThisWeek: sosCount,
      topCrimeType: topCrime[0]?._id || 'Unknown',
      aiBriefing: briefing?.briefing || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load overview analytics' });
  }
});

router.get('/heatmap', async (req, res) => {
  const regionId = req.query.regionId || process.env.REGION_DEFAULT || 'default';
  const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    const reports = await Report.find({ regionId, createdAt: { $gte: since }, verified: true }).lean();
    const points = reports.map((report) => ({
      lat: report.location.coordinates[1],
      lng: report.location.coordinates[0],
      weight: Math.max(1, report.severity || 1)
    }));
    res.json(points);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load heatmap' });
  }
});

router.get('/trends', async (req, res) => {
  const regionId = req.query.regionId || process.env.REGION_DEFAULT || 'default';
  try {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const current = await Report.aggregate([
      { $match: { regionId, createdAt: { $gte: lastWeek } } },
      { $group: { _id: '$crimeType', count: { $sum: 1 } } }
    ]);
    const previous = await Report.aggregate([
      { $match: { regionId, createdAt: { $gte: prevWeek, $lt: lastWeek } } },
      { $group: { _id: '$crimeType', count: { $sum: 1 } } }
    ]);
    const previousMap = previous.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});
    const trends = current.map((item) => ({
      crimeType: item._id,
      count: item.count,
      previousCount: previousMap[item._id] || 0,
      deltaPercent: previousMap[item._id] ? ((item.count - previousMap[item._id]) / previousMap[item._id]) * 100 : 100
    }));
    const alerts = await TrendAlert.find({ regionId }).sort({ detectedAt: -1 }).lean();
    res.json({ trends, alerts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load trend analytics' });
  }
});

export default router;
