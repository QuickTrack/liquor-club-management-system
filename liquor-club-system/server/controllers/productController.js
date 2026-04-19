import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * GET /api/products
 * Get all products
 */
export const getAllProducts = async (req, res, next) => {
  try {
    const { branchId, category, isActive, search, limit = 50, page = 1, sort = 'name:asc' } = req.query;
    const filter = {};

    if (branchId) filter.branchId = branchId;
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortField = sort.split(':')[0];
    const sortDir = sort.includes(':desc') ? -1 : 1;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { products },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id
 * Get single product with stock info
 */
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    // Get current stock
    const currentStock = await StockMovement.getCurrentStock(product._id, product.branchId);

    res.json({
      success: true,
      data: {
        product: {
          ...product.toObject(),
          currentStock,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products
 * Create product
 */
export const createProduct = async (req, res, next) => {
  try {
    const product = new Product(req.body);
    await product.save();

    res.status(201).json({
      success: true,
      data: { product },
      message: 'Product created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/products/:id
 * Update product
 */
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: { product },
      message: 'Product updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id
 * Soft delete product
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, message: 'Product deactivated' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/products/:id/stock
 * Manual stock adjustment
 */
export const updateStock = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity, type, reason, batchNumber, expiryDate } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    // Validate branch access
    if (product.branchId.toString() !== req.branchId.toString()) {
      throw new AppError('Cannot modify stock for another branch', 403, 'BRANCH_MISMATCH');
    }

    // Create stock movement
    const movement = new StockMovement({
      productId,
      branchId: req.branchId,
      type,
      quantity,
      reason,
      batchNumber,
      expiryDate,
      referenceType: 'adjustment',
      referenceId: product._id,
      createdBy: req.userId,
    });

    await movement.save();

    // Get updated stock count
    const currentStock = await StockMovement.getCurrentStock(product._id, req.branchId);

    res.json({
      success: true,
      data: {
        movement,
        currentStock,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/low-stock
 * Get low stock products
 */
export const getLowStockProducts = async (req, res, next) => {
  try {
    const { branchId, threshold = 10 } = req.query;
    const filter = { branchId };

    // Get all products
    const products = await Product.find(filter);

    // Check stock for each
    const lowStock = [];
    for (const product of products) {
      const stock = await StockMovement.getCurrentStock(product._id, branchId);
      if (stock < parseInt(threshold)) {
        lowStock.push({
          ...product.toObject(),
          currentStock: stock,
        });
      }
    }

    res.json({
      success: true,
      data: { products: lowStock },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
};
