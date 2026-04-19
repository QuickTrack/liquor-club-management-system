import { Router } from 'express';
import { authenticate, authorize, requireBranch } from '../middlewares/auth.js';
import { validate, validateParams } from '../middlewares/validation.js';
import Branch from '../models/Branch.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * GET /api/branches
 * Get all branches
 */
router.get('/', authenticate, authorize('admin', 'super_admin'), validate(), async (req, res, next) => {
  try {
    const branches = await Branch.find({}).populate('manager', 'firstName lastName');
    res.json({
      success: true,
      data: { branches },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/branches/:id
 * Get single branch
 */
router.get('/:id', authenticate, validateParams({ id: require('joi').string().hex().length(24) }), async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id).populate('manager', 'firstName lastName');
    if (!branch) {
      throw new AppError('Branch not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { branch } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/branches
 * Create branch (super admin only)
 */
router.post('/', authenticate, authorize('super_admin'), validateBody({
  name: require('joi').string().max(100).required(),
  code: require('joi').string().uppercase().min(3).max(10).required(),
  address: require('joi').object({
    city: require('joi').string().max(100).required(),
    county: require('joi').string().max(100).required(),
    country: require('joi').string().default('Kenya'),
  }).required(),
  contact: require('joi').object({
    phone: require('joi').string().pattern(/^\+?254[0-9]{9}$/).required(),
    email: require('joi').string().email().required(),
  }).required(),
  manager: require('joi').string().hex().length(24).required(),
}), async (req, res, next) => {
  try {
    const branch = new Branch(req.body);
    await branch.save();
    await branch.populate('manager', 'firstName lastName');
    res.status(201).json({ success: true, data: { branch } });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/branches/:id
 * Update branch
 */
router.put('/:id', authenticate, authorize('admin', 'super_admin'), validateParams({ id: require('joi').string().hex().length(24) }), async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('manager', 'firstName lastName');
    if (!branch) {
      throw new AppError('Branch not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { branch } });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/branches/:id
 * Delete branch (soft delete)
 */
router.delete('/:id', authenticate, authorize('super_admin'), validateParams({ id: require('joi').string().hex().length(24) }), async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!branch) {
      throw new AppError('Branch not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, message: 'Branch deactivated' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/branches/:id/inventory-summary
 * Get inventory summary for branch
 */
router.get('/:id/inventory-summary', authenticate, authorize('admin', 'manager', 'auditor'), validateParams({ id: require('joi').string().hex().length(24) }), async (req, res, next) => {
  try {
    // Placeholder - would aggregate stock movements
    res.json({
      success: true,
      data: {
        totalProducts: 0,
        lowStockItems: 0,
        totalValue: 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
