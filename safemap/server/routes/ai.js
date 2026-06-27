import express from 'express';
import { classifyIncident, smartSearch, analyzePatterns, summarizeReport } from '../services/aiService.js';

const router = express.Router();

router.post('/classify', async (req, res) => {
  const { description } = req.body;
  try {
    const result = await classifyIncident(description);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI classification failed' });
  }
});

router.post('/smart-search', async (req, res) => {
  const { query, regionId } = req.body;
  try {
    const filter = await smartSearch(query, regionId);
    res.json(filter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Smart search failed' });
  }
});

router.post('/analyze-patterns', async (req, res) => {
  const { regionId } = req.body;
  try {
    const analysis = await analyzePatterns(regionId);
    res.json(analysis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Pattern analysis failed' });
  }
});

router.post('/summarize', async (req, res) => {
  const { text, imageDescription } = req.body;
  try {
    const summary = await summarizeReport(text, imageDescription);
    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Report summarization failed' });
  }
});

export default router;
