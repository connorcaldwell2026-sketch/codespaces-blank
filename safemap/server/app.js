import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';
import aiRoutes from './routes/ai.js';
import sosRoutes from './routes/sos.js';
import alertsRoutes from './routes/alerts.js';
import watchZonesRoutes from './routes/watchzones.js';
import broadcastsRoutes from './routes/broadcasts.js';
import neighborhoodsRoutes from './routes/neighborhoods.js';
import reportsRoutes from './routes/reports.js';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';
import exportRoutes from './routes/export.js';
import importerRoutes from './routes/importer.js';
import wantedRoutes from './routes/wanted.js';
import trendService from './services/trendService.js';
import { attachUser } from './middleware/auth.js';

dotenv.config();
const app = express();

// Security middlewares
app.use(helmet({
	crossOriginResourcePolicy: false
}));
app.use(helmet.contentSecurityPolicy({
	directives: {
		defaultSrc: ["'self'"],
		scriptSrc: ["'self'", "'unsafe-inline'", process.env.CLIENT_URL || 'http://localhost:3000'],
		styleSrc: ["'self'", "'unsafe-inline'", process.env.CLIENT_URL || 'http://localhost:3000'],
		imgSrc: ["'self'", 'data:', 'https:'],
		connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:3000', 'ws:'],
		frameAncestors: ["'none'"]
	}
}));

// Rate limiting for API
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);

// Prevent NoSQL injection and XSS
app.use(mongoSanitize());
app.use(xssClean());

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(attachUser);
app.use(express.static('public'));

app.use('/api/ai', aiRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/watchzones', watchZonesRoutes);
app.use('/api/broadcasts', broadcastsRoutes);
app.use('/api/neighborhoods', neighborhoodsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/importer', importerRoutes);
app.use('/api/wanted', wantedRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

trendService.start();

export { app };
