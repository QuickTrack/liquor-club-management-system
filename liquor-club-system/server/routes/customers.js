import { Router } from 'express';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCreditCustomers,
  getCustomerCreditHistory,
  updateCreditLimit,
  recordCreditPayment,
} from '../controllers/customerController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, validateParams, validateBody } from '../middlewares/validation.js';
import { schemas } from '../middlewares/validation.js';

const router = Router();

/**
 * GET /api/customers
 * Get all customers (with pagination/filters)
 */
router.get('/', authenticate, authorize('admin', 'manager', 'cashier', 'auditor'), validate(), getAllCustomers);

/**
 * GET /api/customers/credit
 * Get customers with credit balance
 */
router.get('/credit', authenticate, authorize('admin', 'manager', 'auditor'), validate(), getCreditCustomers);

/**
 * GET /api/customers/:id
 * Get single customer with credit history
 */
router.get('/:id', authenticate, authorize('admin', 'manager', 'cashier', 'auditor'), validateParams(schemas.id), getCustomerById);

/**
 * POST /api/customers
 * Create new customer
 */
router.post('/', authenticate, authorize('admin', 'manager', 'cashier'), validateBody(schemas.customer), createCustomer);

/**
 * PUT /api/customers/:id
 * Update customer
 */
router.put('/:id', authenticate, authorize('admin', 'manager'), validateParams(schemas.id), validateBody(schemas.customer), updateCustomer);

/**
 * DELETE /api/customers/:id
 * Soft delete customer
 */
router.delete('/:id', authenticate, authorize('admin', 'manager'), validateParams(schemas.id), deleteCustomer);

/**
 * GET /api/customers/:id/credit-history
 * Get credit transaction history for a customer
 */
router.get('/:id/credit-history', authenticate, authorize('admin', 'manager', 'auditor'), validateParams(schemas.id), getCreditHistory);

/**
 * PUT /api/customers/:id/credit-limit
 * Update customer credit limit
 */
router.put('/:id/credit-limit', authenticate, authorize('admin', 'manager'), validateParams(schemas.id), validateBody({
  creditLimit: require('joi').number().min(0).required(),
}), updateCreditLimit);

/**
 * POST /api/customers/:id/credit-payment
 * Record a credit payment
 */
router.post('/:id/credit-payment', authenticate, authorize('admin', 'manager', 'cashier'), validateParams(schemas.id), validateBody({
  amount: require('joi').number().min(0.01).required(),
  paymentMethod: require('joi').string().valid('cash', 'mpesa', 'card', 'bank_transfer').required(),
  referenceNumber: require('joi').string().max(100).allow(''),
  notes: require('joi').string().max(500).allow(''),
}), recordCreditPayment);

export default router;
