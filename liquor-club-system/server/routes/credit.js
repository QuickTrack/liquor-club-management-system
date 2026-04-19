import { Router } from 'express';
import CreditTransaction from '../models/CreditTransaction.js';
import Customer from '../models/Customer.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, validateParams, validateBody } from '../middlewares/validation.js';
import { schemas } from '../middlewares/validation.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * GET /api/credit/accounts
 * Get all credit accounts
 */
router.get('/accounts', authenticate, authorize('admin', 'manager', 'auditor'), validate(), async (req, res, next) => {
  try {
    const customers = await Customer.find({
      'credit.creditLimit': { $gt: 0 },
    }).select('firstName lastName phone credit currentBalance loyaltyPoints');

    res.json({ success: true, data: { customers } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/credit/aging
 * Get credit aging report
 */
router.get('/aging', authenticate, authorize('admin', 'manager', 'auditor'), validate(), async (req, res, next) => {
  try {
    // Placeholder - would aggregate by age buckets (0-30, 31-60, 60+)
    res.json({
      success: true,
      data: {
        buckets: {
          '0-30': { count: 0, amount: 0 },
          '31-60': { count: 0, amount: 0 },
          '60+': { count: 0, amount: 0 },
        },
        total: { count: 0, amount: 0 },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/credit/transactions/:customerId
 * Get credit transactions for a customer
 */
router.get('/transactions/:customerId', authenticate, validateParams({ customerId: require('joi').string().hex().length(24) }), async (req, res, next) => {
  try {
    const transactions = await CreditTransaction.find({
      customerId: req.params.customerId,
    }).sort({ createdAt: -1 }).limit(100);

    res.json({ success: true, data: { transactions } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/credit/record
 * Record credit transaction (debit or payment)
 */
router.post('/record', authenticate, authorize('admin', 'manager', 'cashier'), validateBody({
  ...schemas.creditTransaction.body.describe().children,
  branchId: require('joi').string().hex().length(24).required(),
}), async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.body.customerId);
    if (!customer) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }

    const transaction = new CreditTransaction({
      ...req.body,
      createdBy: req.userId,
    });

    // Update customer balance and recalc status
    const prevBalance = customer.credit.currentBalance;
    if (req.body.type === 'debit') {
      customer.credit.currentBalance += req.body.amount;
    } else if (req.body.type === 'credit') {
      customer.credit.currentBalance -= req.body.amount;
    }

    // Update credit status based on aging
    transaction.balanceAfter = customer.credit.currentBalance;
    transaction.previousBalance = prevBalance;

    await transaction.save();
    await customer.save();

    res.status(201).json({ success: true, data: { transaction, customer } });
  } catch (error) {
    next(error);
  }
});

export default router;
