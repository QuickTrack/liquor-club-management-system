import { Router } from 'express';
import Supplier from '../models/Supplier.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, validateParams, validateBody } from '../middlewares/validation.js';
import { schemas } from '../middlewares/validation.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * GET /api/suppliers
 * Get all suppliers
 */
router.get('/', authenticate, authorize('admin', 'manager', 'auditor'), validate(), async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: { suppliers } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/suppliers/:id
 * Get single supplier
 */
router.get('/:id', authenticate, authorize('admin', 'manager'), validateParams(schemas.id), async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      throw new AppError('Supplier not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { supplier } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/suppliers
 * Create supplier
 */
router.post('/', authenticate, authorize('admin', 'manager'), validateBody(schemas.supplier), async (req, res, next) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json({ success: true, data: { supplier } });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/suppliers/:id
 * Update supplier
 */
router.put('/:id', authenticate, authorize('admin', 'manager'), validateParams(schemas.id), validateBody(schemas.supplier), async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) {
      throw new AppError('Supplier not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { supplier } });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/suppliers/:id
 * Soft delete supplier
 */
router.delete('/:id', authenticate, authorize('admin'), validateParams(schemas.id), async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!supplier) {
      throw new AppError('Supplier not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, message: 'Supplier deactivated' });
  } catch (error) {
    next(error);
  }
});

export default router;
