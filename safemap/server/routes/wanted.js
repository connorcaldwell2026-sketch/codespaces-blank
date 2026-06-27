import express from 'express';
import WantedPerson from '../models/WantedPerson.js';
import wantedImporter from '../services/wantedImporter.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const list = await WantedPerson.find().sort({ createdAt: -1 }).limit(200);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch wanted list' });
  }
});

router.post('/import', async (req, res) => {
  try {
    const result = await wantedImporter.runWantedImport();
    res.json({ imported: result.length, details: result });
  } catch (err) {
    console.error('Wanted import failed', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
