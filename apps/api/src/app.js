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
import collectorRoutes from './routes/collectors.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import fraudRoutes from './routes/fraud.routes.js';
import auditRoutes from './routes/audit.routes.js';
import authRoutes from './routes/auth.routes.js';
import collectionRoutes from './routes/collection.routes.js';
import collectorPriorityRoutes from './routes/collectorPriority.routes.js';
import financeRoutes from './routes/finance.routes.js';
import donorProfileRoutes from './routes/donorProfile.routes.js';
import visitScheduleRoutes from './routes/visitSchedule.routes.js';
import importRoutes from './routes/import.routes.js';
import exportRoutes from './routes/export.routes.js';
import mlRoutes from './routes/ml.routes.js';
import { seedDevData } from './seed.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Global Middleware ────────────────────────────────────────────
// Trust proxy headers (required for Railway/Vercel reverse proxy + rate limiting)
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
    origin: [
        // Production
        'https://collecti-q-web.vercel.app',

        // Development / Local
        process.env.CLIENT_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:3002',
        'http://127.0.0.1:5173',

        // Allow the Railway API domain itself (for same-origin requests from updated frontend)
        'https://collectiq-api-production.up.railway.app',
    ],
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting: 500 requests per 15 minutes per IP
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
}));

// ── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Public Auth Routes (no JWT required) ─────────────────────────
app.use('/api/auth', authRoutes);

// ── Auth Middleware (all /api routes below require auth) ─────────
app.use('/api', auth);

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/houses', houseRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/collectors', collectorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/audit', auditRoutes);

// Indian Operational & Community Finance Layer (v1 and alias)
app.use('/api/v1/collection', collectionRoutes);
app.use('/api/collection', collectionRoutes);

app.use('/api/v1/collector', collectorPriorityRoutes);
app.use('/api/collector', collectorPriorityRoutes);

app.use('/api/v1/finance', financeRoutes);
app.use('/api/finance', financeRoutes);

// Donor Profile & Duplicates
app.use('/api/v1/donors-profile', donorProfileRoutes);
app.use('/api/donors-profile', donorProfileRoutes);
app.use('/api/v1/donors', donorProfileRoutes);

// Visit Scheduling
app.use('/api/v1/visits', visitScheduleRoutes);
app.use('/api/visits', visitScheduleRoutes);

// Bulk Import & Tabular Export
app.use('/api/v1/import', importRoutes);
app.use('/api/import', importRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/export', exportRoutes);

// Machine Learning & Spatial Intelligence
app.use('/api/v1/ml', mlRoutes);
app.use('/api/ml', mlRoutes);

// ── Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────
app.listen(PORT, async () => {
    console.log(`🚀 CollectiQ API running on http://localhost:${PORT}`);
    // Seed dev data (creates club/event if they don't exist)
    await seedDevData();
});

export default app;
