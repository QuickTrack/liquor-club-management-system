import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  updateStock,
} from '../controllers/productController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, validateParams, validateBody } from '../middlewares/validation.js';
import { schemas } from '../middlewares/validation.js';

const router = Router();

/**
 * GET /api/products
 * Get all products (with pagination/filters)
 */
router.get('/', authenticate, authorize('admin', 'manager', 'cashier', 'bartender', 'auditor'), validate(), getAllProducts);

/**
 * GET /api/products/low-stock
 * Get low stock products
 */
router.get('/low-stock', authenticate, authorize('admin', 'manager', 'auditor'), validate(), getLowStockProducts);

/**
 * GET /api/products/:id
 * Get single product
 */
router.get('/:id', authenticate, authorize('admin', 'manager', 'cashier', 'bartender', 'auditor'), validateParams(schemas.id), getProductById);

/**
 * POST /api/products
 * Create new product
 */
router.post('/', authenticate, authorize('admin', 'manager'), validateBody(schemas.product), createProduct);

/**
 * PUT /api/products/:id
 * Update product
 */
router.put('/:id', authenticate, authorize('admin', 'manager'), validateParams(schemas.id), validateBody(schemas.product), updateProduct);

/**
 * DELETE /api/products/:id
 * Delete product (soft delete)
 */
router.delete('/:id', authenticate, authorize('admin', 'manager'), validateParams(schemas.id), deleteProduct);

/**
 * PATCH /api/products/:id/stock
 * Adjust stock (for manual adjustments, waste, etc.)
 */
router.patch('/:id/stock', authenticate, authorize('admin', 'manager', 'cashier'), validateParams(schemas.id), validateBody(schemas.stockMovement), updateStock);

export default router;
