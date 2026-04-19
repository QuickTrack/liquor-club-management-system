import { Router } from 'express';
import Expense from '../models/Expense.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, validateParams, validateBody } from '../middlewares/validation.js';
import { schemas } from '../middlewares/validation.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * GET /api/expenses
 * Get all expenses
 */
router.get('/', authenticate, authorize('admin', 'manager', 'auditor'), validate(), async (req, res, next) => {
  try {
    const expenses = await Expense.find({})
      .populate('createdBy', 'firstName lastName')
      .populate('paidBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { expenses } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/expenses/:id
 * Get single expense
 */
router.get('/:id', authenticate, validateParams(schemas.id), async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('createdBy');
    if (!expense) {
      throw new AppError('Expense not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { expense } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/expenses
 * Create expense
 */
router.post('/', authenticate, authorize('admin', 'manager', 'cashier'), validateBody(schemas.expense), async (req, res, next) => {
  try {
    req.body.createdBy = req.userId;
    const expense = new Expense(req.body);
    await expense.save();
    await expense.populate('createdBy');
    res.status(201).json({ success: true, data: { expense } });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/expenses/:id
 * Update expense
 */
router.put('/:id', authenticate, authorize('admin', 'manager'), validateParams(schemas.id), validateBody(schemas.expense), async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!expense) {
      throw new AppError('Expense not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { expense } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/expenses/:id/pay
 * Mark expense as paid
 */
router.post('/:id/pay', authenticate, authorize('admin', 'manager'), validateParams(schemas.id), validateBody({
  paymentMethod: require('joi').string().valid('cash', 'mpesa', 'card', 'bank_transfer').required(),
}), async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      throw new AppError('Expense not found', 404, 'NOT_FOUND');
    }

    expense.paymentStatus = 'paid';
    expense.paidAt = new Date();
    expense.paidBy = req.userId;
    expense.paymentMethod = req.body.paymentMethod;

    await expense.save();
    res.json({ success: true, data: { expense } });
  } catch (error) {
    next(error);
  }
});

export default router;
