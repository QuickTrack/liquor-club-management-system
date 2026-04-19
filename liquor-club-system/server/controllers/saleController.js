import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import Customer from '../models/Customer.js';
import { AppError } from '../middlewares/errorHandler.js';
import { KENYA_SPECIFIC } from '../config/constants.js';

/**
 * GET /api/sales
 * Get all sales with pagination and filters
 */
export const getAllSales = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, branchId, startDate, endDate, status, paymentStatus, customerId } = req.query;
    const filter = {};

    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (customerId) filter.customerId = customerId;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate('cashierId', 'firstName lastName')
        .populate('customerId', 'firstName lastName phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Sale.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { sales },
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
 * GET /api/sales/:id
 * Get single sale
 */
export const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashierId', 'firstName lastName')
      .populate('customerId', 'firstName lastName phone')
      .populate('items.productId', 'name sku unitType');

    if (!sale) {
      throw new AppError('Sale not found', 404, 'NOT_FOUND');
    }

    res.json({ success: true, data: { sale } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sales
 * Create new sale
 */
export const createSale = async (req, res, next) => {
  try {
    const session = await Sale.startSession();
    session.startTransaction();

    try {
      const { items, paymentMethod, customerId, tableNumber, orderType, notes, loyaltyPointsRedeemed } = req.body;
      const branchId = req.branchId;
      const cashierId = req.userId;

      // Calculate totals
      let subtotal = 0;
      let taxAmount = 0;
      let exciseDutyAmount = 0;
      let loyaltyPointsDiscount = 0;
      let loyaltyPointsEarned = 0;

      // Build items array with product snapshots
      const saleItems = [];
      let customer = null;

      for (const item of items) {
        const product = await Product.findById(item.productId).session(session);
        if (!product) {
          throw new AppError(`Product not found: ${item.productId}`, 404, 'PRODUCT_NOT_FOUND');
        }

        if (product.branchId.toString() !== branchId.toString()) {
          throw new AppError('Product not available in this branch', 400, 'PRODUCT_BRANCH_MISMATCH');
        }

        // Check stock
        const currentStock = await StockMovement.getCurrentStock(product._id, branchId);
        if (currentStock < item.quantity) {
          throw new AppError(`Insufficient stock for ${product.name}. Available: ${currentStock}`, 400, 'INSUFFICIENT_STOCK');
        }

        // Use provided unitPrice or default to product's sellingPrice
        const unitPrice = item.unitPrice || product.sellingPrice;
        const itemTotal = unitPrice * item.quantity;

        subtotal += itemTotal;

        // Calculate excise duty based on product
        if (product.exciseDuty) {
          exciseDutyAmount += product.exciseDuty * item.quantity;
        }

        // Collect product info for later stock deduction
        saleItems.push({
          productId: product._id,
          productSnapshot: {
            name: product.name,
            sku: product.sku,
            sellingPrice: product.sellingPrice,
            costPrice: product.costPrice,
            unitType: product.unitType,
            alcoholContent: product.alcoholContent,
          },
          quantity: item.quantity,
          unitPrice,
          totalPrice: itemTotal,
          discountAmount: 0,
          notes: item.notes,
        });
      }

      // Calculate tax (VAT)
      taxAmount = subtotal * (KENYA_SPECIFIC.VAT_RATE / 100);

      // Handle loyalty points if customer provided
      if (customerId) {
        customer = await Customer.findById(customerId).session(session);
        if (!customer) {
          throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
        }

        // Calculate points earned: 1 KES = 10 points (configurable per branch)
        loyaltyPointsEarned = Math.floor(subtotal * 10);

        // Apply loyalty points discount if redeemed
        if (loyaltyPointsRedeemed && loyaltyPointsRedeemed > 0) {
          if (loyaltyPointsRedeemed > customer.loyaltyPoints) {
            throw new AppError('Insufficient loyalty points', 400, 'INSUFFICIENT_POINTS');
          }
          loyaltyPointsDiscount = loyaltyPointsRedeemed / 10; // 10 points = 1 KES
          customer.redeemLoyaltyPoints(loyaltyPointsRedeemed);
        }
      }

      // Apply discount codes (if any) - placeholder

      const totalAmount = subtotal + taxAmount + exciseDutyAmount - loyaltyPointsDiscount;

      // Create sale
      const sale = new Sale({
        branchId,
        cashierId,
        customerId,
        tableNumber,
        orderType,
        status: 'completed',
        paymentMethod,
        paymentStatus: 'completed',
        items: saleItems,
        subtotal,
        taxAmount,
        exciseDutyAmount,
        discountTotal: loyaltyPointsDiscount,
        totalAmount,
        paidAt: new Date(),
        loyaltyPointsEarned,
        loyaltyPointsRedeemed,
        loyaltyPointsDiscount,
        notes,
      });

      await sale.save({ session });

      // Update stock for each item
      for (const item of saleItems) {
        await new StockMovement({
          productId: item.productId,
          branchId,
          type: 'sale',
          quantity: -item.quantity, // negative = stock out
          unitCost: item.productSnapshot.costPrice,
          referenceType: 'sale',
          referenceId: sale._id,
          createdBy: cashierId,
        }).save({ session });
      }

      // Update customer's total spent and points
      if (customer) {
        customer.totalSpent += totalAmount;
        customer.addLoyaltyPoints(loyaltyPointsEarned);
        customer.lastVisit = new Date();
        customer.visitCount += 1;
        await customer.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      // Populate for response
      await sale.populate('cashierId', 'firstName lastName');
      await sale.populate('customerId', 'firstName lastName phone');

      res.status(201).json({
        success: true,
        data: { sale },
        message: 'Sale completed successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      session.endTransaction();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sales/:id/void
 * Void a sale
 */
export const voidSale = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      throw new AppError('Sale not found', 404, 'NOT_FOUND');
    }

    sale.void(req.userId, reason);
    await sale.save();

    // Create reversing stock movement
    await StockMovement.create({
      productId: sale.items[0].productId, // Simplified - handle all items
      branchId: sale.branchId,
      type: 'adjustment',
      quantity: sale.items.reduce((sum, item) => sum + item.quantity, 0),
      referenceType: 'sale',
      referenceId: sale._id,
      reason: `Void: ${reason}`,
      createdBy: req.userId,
    });

    res.json({ success: true, message: 'Sale voided', data: { sale } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sales/:id/refund
 * Process refund
 */
export const refundSale = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      throw new AppError('Sale not found', 404, 'NOT_FOUND');
    }

    // Validate refund amount
    if (amount > sale.totalAmount) {
      throw new AppError('Refund amount exceeds sale total', 400, 'INVALID_AMOUNT');
    }

    sale.refund(req.userId, amount, reason);
    await sale.save();

    res.json({ success: true, message: 'Refund processed', data: { sale } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sales/summary
 * Get summary of sales
 */
export const getSalesSummary = async (req, res, next) => {
  try {
    const { startDate, endDate, branchId } = req.query;
    const filter = {};

    if (branchId) filter.branchId = branchId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          avgTransaction: { $avg: '$totalAmount' },
          totalTax: { $sum: '$taxAmount' },
          totalExcise: { $sum: '$exciseDutyAmount' },
          voids: { $sum: { $cond: [{ $eq: ['$status', 'voided'] }, 1, 0] } },
          refunds: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] } },
        },
      },
    ];

    const [result] = await Sale.aggregate(pipeline);

    res.json({
      success: true,
      data: {
        summary: result || {
          totalSales: 0,
          totalTransactions: 0,
          avgTransaction: 0,
          totalTax: 0,
          totalExcise: 0,
          voids: 0,
          refunds: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllSales,
  getSaleById,
  createSale,
  voidSale,
  refundSale,
  getSalesSummary,
};
