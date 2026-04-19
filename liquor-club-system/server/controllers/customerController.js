import Customer from '../models/Customer.js';
import CreditTransaction from '../models/CreditTransaction.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * GET /api/customers
 * Get all customers
 */
export const getAllCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, tier, hasCredit } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { customerNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (tier) filter.tier = tier;
    if (hasCredit === 'true') {
      filter['credit.creditLimit'] = { $gt: 0 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort({ lastName: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Customer.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { customers },
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
 * GET /api/customers/credit
 * Get customers with credit accounts
 */
export const getCreditCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find({
      'credit.creditLimit': { $gt: 0 },
      isActive: true,
    }).sort({ 'credit.currentBalance': -1 });

    res.json({
      success: true,
      data: { customers },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/customers/:id
 * Get single customer
 */
export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }

    // Get credit transactions
    const creditHistory = await CreditTransaction.find({ customerId: customer._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        customer,
        creditHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/customers
 * Create customer
 */
export const createCustomer = async (req, res, next) => {
  try {
    // Generate customer number
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await Customer.countDocuments({
      createdAt: {
        $gte: new Date(year, new Date().getMonth(), 1),
      },
    });
    const customerNumber = `CUST-${year}${month}-${String(count + 1).padStart(4, '0')}`;

    const customer = new Customer({
      ...req.body,
      customerNumber,
    });

    await customer.save();

    res.status(201).json({
      success: true,
      data: { customer },
      message: 'Customer created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/customers/:id
 * Update customer
 */
export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: { customer },
      message: 'Customer updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/customers/:id
 * Soft delete customer
 */
export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!customer) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/customers/:id/credit-payment
 * Record payment against credit account
 */
export const recordCreditPayment = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { amount, paymentMethod, referenceNumber, notes } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }

    if (amount > customer.credit.currentBalance) {
      throw new AppError('Payment amount exceeds outstanding balance', 400, 'EXCEEDS_BALANCE');
    }

    // Record credit transaction (credit reduces balance)
    const transaction = new CreditTransaction({
      customerId,
      branchId: customer.branchId || req.branchId,
      transactionNumber: `CRT-${Date.now()}`,
      type: 'credit',
      amount,
      previousBalance: customer.credit.currentBalance,
      balanceAfter: customer.credit.currentBalance - amount,
      referenceType: 'payment',
      referenceId: customer._id,
      description: `Payment via ${paymentMethod}${referenceNumber ? ` (Ref: ${referenceNumber})` : ''}`,
      paidAt: new Date(),
      paidBy: req.userId,
      status: 'paid',
    });

    // Update customer
    customer.credit.currentBalance -= amount;
    customer.credit.lastPaymentDate = new Date();
    customer.credit.lastPaymentAmount = amount;

    // Update credit status if needed
    if (customer.credit.currentBalance === 0) {
      customer.credit.creditStatus = 'good';
    }

    await Promise.all([transaction.save(), customer.save()]);

    res.json({
      success: true,
      data: { transaction, customer },
      message: 'Payment recorded successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllCustomers,
  getCreditCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  recordCreditPayment,
};
