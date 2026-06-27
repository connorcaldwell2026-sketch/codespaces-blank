import express from 'express';
import crypto from 'crypto';
import Report from '../models/Report.js';
import { getIo } from '../socket/handlers.js';
import Comment from '../models/Comment.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return undefined;
};

router.get('/', async (req, res) => {
  const filter = {};
  const { regionId, crimeType, status, verified, since, until, centerLat, centerLng, radiusKm } = req.query;
  if (regionId) filter.regionId = regionId;
  if (crimeType) filter.crimeType = crimeType;
  if (status) filter.status = status;
  if (verified !== undefined) filter.verified = parseBoolean(verified);
  if (since || until) {
    filter.createdAt = {};
    if (since) filter.createdAt.$gte = new Date(since);
    if (until) filter.createdAt.$lte = new Date(until);
  }
  if (centerLat && centerLng && radiusKm) {
    filter.location = {
      $geoWithin: {
        $centerSphere: [[parseFloat(centerLng), parseFloat(centerLat)], parseFloat(radiusKm) / 6378.1]
      }
    };
  }

  try {
    const reports = await Report.find(filter).sort({ createdAt: -1 }).lean();
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const report = await Report.findById(id).populate('comments').lean();
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load report' });
  }
});

router.post('/', async (req, res) => {
  const payload = req.body || {};
  if (req.user?.sub) {
    payload.userId = req.user.sub;
  }
  const {
    description,
    crimeType,
    regionId,
    suggestedTags,
    aiFlagged,
    userId,
    incidentTime,
    address,
    victimCount,
    witnessCount,
    mediaUrls,
    reporterContact,
    reporterConfidence,
    source,
    additionalDetails,
    isEmergency,
    location
  } = payload;

  if (!description || description.trim().length < 10) {
    return res.status(400).json({ error: 'Description is required (min 10 chars)' });
  }

  const redaction = (text) => {
    if (!text) return text;
    return text.replace(/\b(\+?\d[\d\-() ]{6,}\d)\b/g, '[redacted]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted]');
  };

  try {
    const doc = {
      description: redaction(description),
      crimeType,
      suggestedTags: Array.isArray(suggestedTags) ? suggestedTags : (suggestedTags ? suggestedTags.split(',').map((s) => s.trim()) : []),
      severity: payload.severity || 5,
      regionId: regionId || process.env.REGION_DEFAULT || 'us',
      verified: false,
      status: aiFlagged ? 'Review' : 'Incoming',
      createdBy: userId,
      incidentTime: incidentTime ? new Date(incidentTime) : new Date(),
      address: redaction(address),
      victimCount: parseInt(victimCount || 0, 10),
      witnessCount: parseInt(witnessCount || 0, 10),
      mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : (mediaUrls ? [mediaUrls] : []),
      reporterContact: reporterContact ? '[redacted]' : undefined,
      reporterConfidence: reporterConfidence || 80,
      source: source || 'user',
      additionalDetails: redaction(additionalDetails),
      isEmergency: !!isEmergency,
      createdAt: new Date()
    };

    if (location && location.coordinates && location.coordinates.length === 2) {
      doc.location = { type: 'Point', coordinates: location.coordinates };
    } else {
      doc.location = { type: 'Point', coordinates: [-74.0060, 40.7128] };
    }

    const newReport = await Report.create(doc);
    try {
      const io = getIo();
      const payload = {
        id: newReport._id,
        regionId: newReport.regionId,
        location: newReport.location,
        crimeType: newReport.crimeType,
        severity: newReport.severity,
        createdAt: newReport.createdAt
      };
      io.to(newReport.regionId).emit('report:created', payload);
      io.emit('report:created', payload);
    } catch (err) {
      console.warn('Socket emit failed', err.message || err);
    }
    res.json(newReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, verified, severity, assignedTo, assignedAt, resolvedAt, regionId } = req.body;
  try {
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (status) report.status = status;
    if (verified !== undefined) report.verified = parseBoolean(verified);
    if (severity !== undefined) report.severity = severity;
    if (assignedTo) report.assignedTo = assignedTo;
    if (assignedAt) report.assignedAt = new Date(assignedAt);
    if (resolvedAt) report.resolvedAt = new Date(resolvedAt);
    if (regionId) report.regionId = regionId;
    await report.save();
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

router.post('/:id/assign', authenticate, async (req, res) => {
  const { id } = req.params;
  const officerId = req.body.officerId || req.user?.sub;
  try {
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    report.assignedTo = officerId;
    report.assignedAt = new Date();
    report.status = 'Assigned';
    await report.save();
    const io = getIo();
    io.emit('report:assigned', { reportId: id, officerId });
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to assign report' });
  }
});

router.post('/:id/note', authenticate, async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const authorId = req.user?.sub;
  try {
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    report.internalNotes = report.internalNotes || [];
    report.internalNotes.push({ authorId, text, createdAt: new Date() });
    await report.save();
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add internal note' });
  }
});

router.post('/:id/witness-token', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    const token = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    report.witnessToken = token;
    await report.save();
    res.json({ witnessToken: token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate witness token' });
  }
});

router.post('/:id/react', authenticate, async (req, res) => {
  const { id } = req.params;
  const reaction = req.body.reaction;
  const userId = req.user?.sub;
  try {
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    report.reactions = report.reactions || [];
    const existing = report.reactions.find((r) => r.userId === userId && r.type === reaction);
    if (!existing) {
      report.reactions.push({ userId, type: reaction, count: 1 });
    }
    await report.save();
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

router.post('/:id/comment', authenticate, async (req, res) => {
  const { id } = req.params;
  const { text, isVerified } = req.body;
  const userId = req.user?.sub;
  try {
    const flagged = /\b(address|phone|ssn|hate|slur)\b/i.test(text);
    const comment = await Comment.create({
      reportId: id,
      userId,
      text,
      flagged,
      createdAt: new Date(),
      verifiedUser: isVerified || false
    });
    res.json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
