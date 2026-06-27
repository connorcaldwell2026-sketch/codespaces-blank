import express from 'express';
import Report from '../models/Report.js';
import { getIo } from '../socket/handlers.js';
import { sendAlertSms } from '../services/alertService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { location, regionId, emergencyContact, summary } = req.body;
  const userId = req.user?.sub;
  try {
    const sosReport = await Report.create({
      description: summary || 'SOS emergency report',
      crimeType: 'Emergency',
      verified: true,
      priority: 1,
      status: 'Incoming',
      regionId: regionId || process.env.REGION_DEFAULT || 'default',
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      },
      severity: 10,
      isEmergency: true,
      createdBy: userId,
      createdAt: new Date()
    });
    const io = getIo();
    io.emit('sos:alert', sosReport);
    if (emergencyContact) {
      await sendAlertSms(emergencyContact, `SOS triggered at ${location.lat},${location.lng}. Police alert active.`);
    }
    res.json(sosReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create SOS report' });
  }
});

export default router;
