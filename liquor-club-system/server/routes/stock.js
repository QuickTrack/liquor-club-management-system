import { Router } from 'express';
import StockMovement from '../models/StockMovement.js';
import Product from '../models/Product.js';
import { authenticate, authorize, requireBranch } from '../middlewares/auth.js';
import { AppError } from '../middlewares/errorHandler.js';
import { schemas } from '../middlewares/validation.js';
import { validate, validateParams, validateBody } from '../middlewares/validation.js';

const router = Router();

/**
 * GET /api/stock/movements
 * Get stock movements with filters
 */
router.get('/movements', authenticate, authorize('admin', 'manager', 'auditor'), validate(), async (req, res, next) => {
  try {
    const { branchId, type, productId, limit = 100 } = req.query;
    const filter = {};

    if (branchId) filter.branchId = branchId;
    if (type) filter.type = type;
    if (productId) filter.productId = productId;

    const movements = await StockMovement.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('productId', 'name sku')
      .populate('createdBy', 'firstName lastName');

    res.json({ success: true, data: { movements } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stock/levels
 * Get current stock levels for all products in a branch
 */
router.get('/levels', authenticate, authorize('admin', 'manager', 'cashier', 'bartender'), validate(), async (req, res, next) => {
  try {
    const { branchId } = req.query;

    if (!branchId) {
      throw new AppError('Branch ID is required', 400, 'BRANCH_REQUIRED');
    }

    // Get all products for branch
    const products = await Product.find({ branchId, isActive: true }).select('name sku unitType conversionRate');

    // For each product, calculate current stock from movements
    const stockLevels = await Promise.all(
      products.map(async (product) => {
        const movements = await StockMovement.find({
          productId: product._id,
          branchId,
        });

        let currentStock = 0;
        movements.forEach((m) => {
          currentStock += m.quantity;
        });

        return {
          product: {
            id: product._id,
            name: product.name,
            sku: product.sku,
            unitType: product.unitType,
            conversionRate: product.conversionRate,
          },
          currentStock,
          isLow: currentStock < 10, // Configurable threshold
        };
      })
    );

    res.json({ success: true, data: { stockLevels } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/stock/movements
 * Record stock movement (purchase, waste, transfer, etc.)
 */
router.post('/movements', authenticate, authorize('admin', 'manager'), validateBody(schemas.stockMovement), async (req, res, next) => {
  try {
    const movement = new StockMovement({
      ...req.body,
      createdBy: req.userId,
    });

    await movement.save();
    await movement.populate(['productId', 'createdBy', 'branchId']);

    // Update product quantity (could use virtuals but simplified here)
    // Actually we compute from movements, so no product.qty field needed

    res.status(201).json({ success: true, data: { movement } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stock/valuation
 * Get inventory valuation (FIFO/LIFO)
 */
router.get('/valuation', authenticate, authorize('admin', 'manager', 'auditor'), validate(), async (req, res, next) => {
  try {
    const { branchId, method = 'FIFO' } = req.query;

    // Placeholder - would implement FIFO/LIFO valuation
    res.json({
      success: true,
      data: {
        totalValue: 0,
        method,
        valuationDate: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
