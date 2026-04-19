import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, validateParams, validateBody } from '../middlewares/validation.js';
import { schemas } from '../middlewares/validation.js';
import Report from '../models/Report.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * GET /api/reports
 * List all reports (with pagination)
 */
router.get('/', authenticate, authorize('admin', 'manager', 'auditor'), validate(), async (req, res, next) => {
  try {
    const reports = await Report.find({ createdBy: req.userId })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: { reports } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/reports/generate
 * Generate a new report
 */
router.post('/generate', authenticate, authorize('admin', 'manager', 'auditor'), validateBody(schemas.report), async (req, res, next) => {
  try {
    // Placeholder for report generation logic
    res.json({
      success: true,
      message: 'Report generation triggered',
      data: { reportId: null },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/:id
 * Get specific report
 */
router.get('/:id', authenticate, validateParams(schemas.id), async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).populate('createdBy');
    if (!report) {
      throw new AppError('Report not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { report } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/reports/:id/export
 * Export report to PDF/CSV
 */
router.post('/:id/export', authenticate, validateParams(schemas.id), validateBody({
  format: require('joi').string().valid('pdf', 'csv', 'excel').required(),
}), async (req, res, next) => {
  try {
    const { format } = req.body;
    res.json({
      success: true,
      message: `Report exported as ${format}`,
      data: { downloadUrl: `/api/reports/${req.params.id}/download?format=${format}` },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
