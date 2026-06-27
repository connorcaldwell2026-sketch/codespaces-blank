import express from 'express';
import WatchZone from '../models/WatchZone.js';
import Broadcast from '../models/Broadcast.js';

const router = express.Router();

router.get('/my', async (req, res) => {
  const userId = req.query.userId;
  try {
    const zones = await WatchZone.find({ userId }).lean();
    const broadcasts = await Broadcast.find({ expiresAt: { $gt: new Date() } }).lean();
    res.json({ watchZones: zones, broadcasts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load alerts' });
  }
});

export default router;
