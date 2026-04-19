import { Router } from 'express';
import SystemSettings from '../models/SystemSettings.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, validateParams, validateBody } from '../middlewares/validation.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * GET /api/settings
 * Get all settings (or branch-specific)
 */
router.get('/', authenticate, authorize('admin', 'manager'), validate(), async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const filter = branchId ? { branchId, isGlobal: false } : { isGlobal: true };

    const settings = await SystemSettings.find(filter);
    res.json({ success: true, data: { settings } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/settings/:key
 * Get setting by key
 */
router.get('/:key', authenticate, authorize('admin', 'manager'), validateParams({ key: require('joi').string().required() }), async (req, res, next) => {
  try {
    const { key } = req.params;
    const { branchId } = req.query;

    const filter = { key };
    if (branchId) {
      filter.branchId = branchId;
      filter.isGlobal = false;
    } else {
      filter.isGlobal = true;
    }

    const setting = await SystemSettings.findOne(filter);
    if (!setting) {
      throw new AppError('Setting not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { setting } });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/settings/:key
 * Update setting
 */
router.put('/:key', authenticate, authorize('admin', 'super_admin'), validateParams({ key: require('joi').string().required() }), validateBody({
  value: require('joi').any().required(),
  description: require('joi').string().max(500).allow(''),
}), async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    const { branchId } = req.body;

    const filter = { key };
    if (branchId) {
      filter.branchId = branchId;
    } else {
      filter.isGlobal = true;
    }

    const setting = await SystemSettings.findOneAndUpdate(
      filter,
      { value, description, updatedBy: req.userId },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: { setting } });
  } catch (error) {
    next(error);
  }
});

export default router;
