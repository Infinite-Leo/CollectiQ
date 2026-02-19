// MUST be first — loads .env before any module that reads process.env
import './env.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';
import { auth } from './middleware/auth.js';
import clubRoutes from './routes/clubs.routes.js';
import eventRoutes from './routes/events.routes.js';
import donationRoutes from './routes/donations.routes.js';
import houseRoutes from './routes/houses.routes.js';
import donorRoutes from './routes/donors.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import fraudRoutes from './routes/fraud.routes.js';
import auditRoutes from './routes/audit.routes.js';
import { seedDevData } from './seed.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Global Middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

// Rate limiting: 100 requests per 15 minutes per IP
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
}));

// ── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Auth Middleware (all /api routes below require auth) ─────────
app.use('/api', auth);

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/houses', houseRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/audit', auditRoutes);

// ── Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────
app.listen(PORT, async () => {
    console.log(`🚀 CollectiQ API running on http://localhost:${PORT}`);
    // Seed dev data (creates club/event if they don't exist)
    await seedDevData();
});

export default app;
