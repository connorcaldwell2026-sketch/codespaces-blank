import express from 'express';
import WatchZone from '../models/WatchZone.js';

import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { userId, regionId } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (regionId) filter.regionId = regionId;
    const zones = await WatchZone.find(filter).sort({ createdAt: -1 });
    res.json(zones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load watch zones' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const payload = req.body || {};
    const watchZone = await WatchZone.create({
      regionId: payload.regionId || process.env.REGION_DEFAULT || 'us',
      userId: req.user?.sub || payload.userId,
      name: payload.name || 'Watch Area',
      polygon: payload.polygon || [],
      startAt: payload.startAt ? new Date(payload.startAt) : new Date(),
      endAt: payload.endAt ? new Date(payload.endAt) : null,
      alertTypes: Array.isArray(payload.alertTypes) ? payload.alertTypes : [],
      description: payload.description || '',
      createdAt: new Date()
    });
    res.json(watchZone);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create watch zone' });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const patch = req.body || {};
    const watchZone = await WatchZone.findById(id);
    if (!watchZone) return res.status(404).json({ error: 'Watch zone not found' });
    watchZone.name = patch.name || watchZone.name;
    watchZone.polygon = patch.polygon || watchZone.polygon;
    watchZone.alertTypes = Array.isArray(patch.alertTypes) ? patch.alertTypes : watchZone.alertTypes;
    watchZone.description = patch.description || watchZone.description;
    if (patch.startAt) watchZone.startAt = new Date(patch.startAt);
    if (patch.endAt) watchZone.endAt = new Date(patch.endAt);
    await watchZone.save();
    res.json(watchZone);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update watch zone' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await WatchZone.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Watch zone not found' });
    res.json({ success: true, id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete watch zone' });
  }
});

export default router;
