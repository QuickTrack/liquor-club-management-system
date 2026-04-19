import { Router } from 'express';
import Purchase from '../models/Purchase.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, validateParams, validateBody } from '../middlewares/validation.js';
import { schemas } from '../middlewares/validation.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * GET /api/purchases
 * Get all purchase orders
 */
router.get('/', authenticate, authorize('admin', 'manager', 'auditor'), validate(), async (req, res, next) => {
  try {
    const purchases = await Purchase.find({})
      .populate('supplierId', 'name supplierCode')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { purchases } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/purchases/:id
 * Get single purchase
 */
router.get('/:id', authenticate, validateParams(schemas.id), async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplierId', 'name supplierCode')
      .populate('createdBy', 'firstName lastName');
    if (!purchase) {
      throw new AppError('Purchase not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { purchase } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/purchases
 * Create purchase order
 */
router.post('/', authenticate, authorize('admin', 'manager'), validateBody(schemas.purchase), async (req, res, next) => {
  try {
    req.body.createdBy = req.userId;
    const purchase = new Purchase(req.body);
    await purchase.save();
    await purchase.populate('supplierId', 'name supplierCode');
    res.status(201).json({ success: true, data: { purchase } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/purchases/:id/receive
 * Mark purchase as received (goods receipt)
 */
router.post('/:id/receive', authenticate, authorize('admin', 'manager'), validateParams(schemas.id), validateBody({
  receivedQty: require('joi').number().integer().min(1).required(),
}), async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      throw new AppError('Purchase not found', 404, 'NOT_FOUND');
    }

    if (purchase.status === 'received' || purchase.status === 'cancelled') {
      throw new AppError('Purchase cannot be received', 400, 'INVALID_STATUS');
    }

    purchase.receivedBy = req.userId;
    purchase.receivedAt = new Date();
    purchase.status = 'received';
    await purchase.save();

    res.json({ success: true, data: { purchase } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/purchases/:id/pay
 * Record payment for purchase
 */
router.post('/:id/pay', authenticate, authorize('admin', 'manager'), validateParams(schemas.id), validateBody({
  amount: require('joi').number().min(0.01).required(),
  paymentMethod: require('joi').string().valid('cash', 'mpesa', 'card', 'bank_transfer').required(),
}), async (req, res, next) => {
  try {
    const { amount, paymentMethod } = req.body;
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      throw new AppError('Purchase not found', 404, 'NOT_FOUND');
    }

    purchase.markAsPaid(amount, paymentMethod);
    await purchase.save();

    res.json({ success: true, data: { purchase } });
  } catch (error) {
    next(error);
  }
});

export default router;
