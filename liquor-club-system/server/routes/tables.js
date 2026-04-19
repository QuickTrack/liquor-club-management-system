import { Router } from 'express';
import Table from '../models/Table.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, validateParams, validateBody } from '../middlewares/validation.js';
import { schemas } from '../middlewares/validation.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * GET /api/tables
 * Get tables for a branch
 */
router.get('/', authenticate, authorize('admin', 'manager', 'cashier', 'bartender'), validate(), async (req, res, next) => {
  try {
    const { branchId, status } = req.query;
    const filter = {};

    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;

    const tables = await Table.find(filter).sort({ tableNumber: 1 });
    res.json({ success: true, data: { tables } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tables/:id
 * Get table details
 */
router.get('/:id', authenticate, validateParams(schemas.id), async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id).populate('currentTabId');
    if (!table) {
      throw new AppError('Table not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { table } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tables
 * Create table
 */
router.post('/', authenticate, authorize('admin', 'manager'), validateBody({
  branchId: require('joi').string().hex().length(24).required(),
  tableNumber: require('joi').string().required(),
  capacity: require('joi').number().min(1).required(),
  section: require('joi').string().allow(''),
}), async (req, res, next) => {
  try {
    const table = new Table(req.body);
    await table.save();
    res.status(201).json({ success: true, data: { table } });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tables/:id
 * Update table
 */
router.put('/:id', authenticate, authorize('admin', 'manager'), validateParams(schemas.id), validateBody({
  capacity: require('joi').number().min(1).allow(null),
  status: require('joi').string().valid('available','occupied','reserved','out_of_service','cleaning').allow(''),
  section: require('joi').string().allow(''),
}), async (req, res, next) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!table) {
      throw new AppError('Table not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { table } });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/tables/:id
 * Remove table
 */
router.delete('/:id', authenticate, authorize('admin'), validateParams(schemas.id), async (req, res, next) => {
  try {
    await Table.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Table deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
