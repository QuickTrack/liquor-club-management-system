import { Router } from 'express';
import {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  voidSale,
  refundSale,
  getSalesSummary,
} from '../controllers/saleController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, validateParams, validateBody } from '../middlewares/validation.js';
import { schemas } from '../middlewares/validation.js';

const router = Router();

/**
 * GET /api/sales
 * Get all sales (with filters)
 * Requires: admin, manager, cashier, auditor
 */
router.get('/', authenticate, authorize('admin', 'manager', 'cashier', 'auditor'), validate(), getAllSales);

/**
 * GET /api/sales/summary
 * Get sales summary (daily weekly monthly)
 */
router.get('/summary', authenticate, authorize('admin', 'manager', 'auditor'), validate(), getSalesSummary);

/**
 * GET /api/sales/:id
 * Get single sale by ID
 */
router.get('/:id', authenticate, authorize('admin', 'manager', 'cashier', 'auditor'), validateParams(schemas.id), getSaleById);

/**
 * POST /api/sales
 * Create new sale (POS)
 */
router.post('/', authenticate, authorize('cashier', 'waiter', 'bartender'), validateBody(schemas.saleCreate), createSale);

/**
 * PUT /api/sales/:id
 * Update sale (limited fields)
 */
router.put('/:id', authenticate, authorize('admin', 'manager'), validateBody({
  status: schemas.saleCreate.body.children.status,
  notes: schemas.saleCreate.body.children.notes,
}), updateSale);

/**
 * POST /api/sales/:id/void
 * Void a sale
 */
router.post('/:id/void', authenticate, authorize('admin', 'manager'), validateParams(schemas.id), validateBody({
  reason: require('joi').string().max(500).required(),
}), voidSale);

/**
 * POST /api/sales/:id/refund
 * Process refund
 */
router.post('/:id/refund', authenticate, authorize('admin', 'manager'), validateParams(schemas.id), validateBody({
  amount: require('joi').number().min(0.01).required(),
  reason: require('joi').string().max(500).required(),
}), refundSale);

export default router;
