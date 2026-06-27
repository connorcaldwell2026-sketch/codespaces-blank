import express from 'express';
import Neighborhood from '../models/Neighborhood.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { regionId, q } = req.query;
  const filter = {};
  if (regionId) filter.regionId = regionId;
  if (q) filter.name = new RegExp(q, 'i');
  try {
    const neighborhoods = await Neighborhood.find(filter).sort({ safetyScore: -1, name: 1 }).lean();
    res.json(neighborhoods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load neighborhoods' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const neighborhood = await Neighborhood.findById(id).lean();
    if (!neighborhood) return res.status(404).json({ error: 'Neighborhood not found' });
    res.json(neighborhood);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load neighborhood' });
  }
});

router.post('/join', authenticate, async (req, res) => {
  const { neighborhoodId } = req.body;
  const userId = req.user?.sub;
  try {
    const neighborhood = await Neighborhood.findById(neighborhoodId);
    if (!neighborhood) return res.status(404).json({ error: 'Neighborhood not found' });
    if (!neighborhood.memberIds.includes(userId)) {
      neighborhood.memberIds.push(userId);
      neighborhood.activityScore = (neighborhood.activityScore || 0) + 1;
      await neighborhood.save();
    }
    res.json(neighborhood);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to join neighborhood' });
  }
});

export default router;
