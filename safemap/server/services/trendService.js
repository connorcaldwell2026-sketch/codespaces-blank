import cron from 'node-cron';
import Report from '../models/Report.js';
import TrendAlert from '../models/TrendAlert.js';
import PatternAnalysis from '../models/PatternAnalysis.js';
import { getIo } from '../socket/handlers.js';
import { analyzePatterns } from './aiService.js';

const detectSpikeAlerts = async () => {
  const regionId = process.env.REGION_DEFAULT || 'default';
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
  for (const item of current) {
    const previousCount = previousMap[item._id] || 0;
    const delta = previousCount > 0 ? ((item.count - previousCount) / previousCount) * 100 : 100;
    if (delta > 50) {
      await TrendAlert.create({ crimeType: item._id, regionId, deltaPercent: delta, published: true });
      getIo().emit('trend:spike', { crimeType: item._id, region: regionId, delta });
    }
  }
};

const runDailyAnalysis = async () => {
  const regionId = process.env.REGION_DEFAULT || 'default';
  try {
    await analyzePatterns(regionId);
  } catch (error) {
    console.error('Failed daily analysis', error);
  }
};

const start = () => {
  cron.schedule('0 2 * * *', async () => {
    await runDailyAnalysis();
    await detectSpikeAlerts();
  }, { timezone: 'UTC' });
};

export default { start };
