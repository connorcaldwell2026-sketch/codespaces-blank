import express from 'express';
import importerService from '../services/importerService.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/run', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const result = await importerService.runImport();
    res.json(result);
  } catch (err) {
    console.error('Import failed', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
