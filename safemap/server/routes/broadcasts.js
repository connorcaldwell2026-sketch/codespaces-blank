import express from 'express';
import Broadcast from '../models/Broadcast.js';
import { getIo } from '../socket/handlers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, requireRole(['police', 'admin']), async (req, res) => {
  const { message, type, regionId, durationHours } = req.body;
  const createdBy = req.user?.sub;
  try {
    const expiresAt = new Date(Date.now() + (durationHours || 1) * 3600000);
    const broadcast = await Broadcast.create({
      message,
      type,
      region: regionId,
      expiresAt,
      createdBy,
      createdAt: new Date()
    });
    getIo().emit('broadcast:alert', { message, type, expiresAt });
    res.json(broadcast);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

export default router;
