import { Router } from 'express';
import { predictExpectedDonation, getModelInfo } from '../services/predictionService.js';
import { clusterTerritories } from '../services/clusteringService.js';
import { compareDonorNames } from '../services/phoneticMatcher.js';

const router = Router();

/**
 * POST /api/v1/ml/predict-expected
 * Real-time inference endpoint for expected donation calculation
 */
router.post('/predict-expected', async (req, res, next) => {
    try {
        const {
            donation_2025,
            donation_2024,
            donation_2023,
            locality_tier,
            house_type,
            preferred_mode,
            earning_members,
        } = req.body;

        const result = predictExpectedDonation({
            donation_2025,
            donation_2024,
            donation_2023,
            locality_tier,
            house_type,
            preferred_mode,
            earning_members,
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/v1/ml/model-info
 * Returns model architecture, metrics (R2, MAE), and feature importances for viva/reports
 */
router.get('/model-info', async (req, res, next) => {
    try {
        const info = getModelInfo();
        res.json({
            success: true,
            model: info,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/v1/ml/compare-names
 * Compares two names using Double Metaphone, Jaro-Winkler, and Bengali surname aliases
 */
router.post('/compare-names', async (req, res, next) => {
    try {
        const { name1, name2 } = req.body;
        if (!name1 || !name2) {
            return res.status(400).json({ error: 'Both name1 and name2 are required' });
        }

        const comparison = compareDonorNames(name1, name2);
        res.json({
            success: true,
            comparison,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
