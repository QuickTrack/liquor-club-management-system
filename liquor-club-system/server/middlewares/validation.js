import Joi from 'joi';

// Base schemas
const idSchema = Joi.string().hex().length(24);
const pageSchema = Joi.number().integer().min(1).default(1);
const limitSchema = Joi.number().integer().min(1).max(100).default(50);
const sortSchema = Joi.string(); // "field:asc" or "field:desc"
const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')),
});

// Common validation schemas
export const schemas = {
  // Pagination
  pagination: Joi.object({
    page: pageSchema,
    limit: limitSchema,
    sort: sortSchema,
  }),

  // Date range filter
  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
  }),

  // ID param
  id: Joi.object({
    id: idSchema.required(),
  }),

  // Branch context
  branchContext: Joi.object({
    branchId: idSchema,
  }),

  // User creation
  userCreate: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    phone: Joi.string().pattern(/^\+?254[0-9]{9}$|^07[0-9]{8}$/).required(),
    role: Joi.string().valid('admin', 'manager', 'cashier', 'bartender', 'auditor', 'waiter').required(),
    branchId: idSchema.required(),
    employeeId: Joi.string().min(3).max(20).uppercase().required(),
    authMethod: Joi.string().valid('password', 'pin', 'biometric').default('password'),
    pin: Joi.string().length(4, 6).when('authMethod', { is: 'pin', then: Joi.required() }),
  }),

  // Login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    branchId: idSchema.required(),
  }),

  // PIN login
  pinLogin: Joi.object({
    phone: Joi.string().pattern(/^\+?254[0-9]{9}$|^07[0-9]{8}$/).required(),
    pin: Joi.string().length(4, 6).required(),
    branchId: idSchema.required(),
  }),

  // Product creation/update
  product: Joi.object({
    sku: Joi.string().uppercase().min(3).max(50).required(),
    name: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).allow(''),
    category: Joi.string().valid(
      'beer', 'wine', 'spirits', 'liqueur', 'cocktail',
      'ready_to_drink', 'non_alcoholic', 'tobacco', 'snacks', 'merchandise'
    ).required(),
    brand: Joi.string().max(100).allow(''),
    alcoholContent: Joi.number().min(0).max(100).allow(null),
    volume: Joi.number().min(0).required(),
    unitType: Joi.string().valid(
      'bottle', 'crate', 'carton', 'shot', 'glass',
      'pint', 'litre', 'ml', 'can', 'keg', 'case'
    ).required(),
    conversionRate: Joi.number().min(1).default(1).required(),
    costPrice: Joi.number().min(0).required(),
    sellingPrice: Joi.number().min(0).required(),
    wholesalePrice: Joi.number().min(0).allow(null),
    retailPrice: Joi.number().min(0).allow(null),
    barcode: Joi.string().max(50).allow(''),
    isAlcoholic: Joi.boolean().default(true),
    exciseDutyCategory: Joi.string().valid('beer', 'wine', 'spirits', 'cider', 'none'),
    branchId: idSchema.required(),
    departmentId: idSchema.allow(null),
    taxRate: Joi.number().min(0).max(100).default(16),
    exciseDuty: Joi.number().min(0).default(0),
    trackExpiry: Joi.boolean().default(false),
    expiryWarningDays: Joi.number().min(1).default(30),
    isActive: Joi.boolean().default(true),
  }),

  // Stock movement (waste/adjustment)
  stockMovement: Joi.object({
    productId: idSchema.required(),
    quantity: Joi.number().required(),
    type: Joi.string().valid(
      'sale', 'purchase', 'transfer', 'waste', 'breakage',
      'spillage', 'adjustment', 'return', 'initial_stock'
    ).required(),
    reason: Joi.string().max(200).allow(''),
    notes: Joi.string().max(500).allow(''),
    batchNumber: Joi.string().max(50).allow(''),
    expiryDate: Joi.date().iso().allow(null),
    destinationBranchId: idSchema.allow(null),
    supplierId: idSchema.allow(null),
  }),

  // Create sale
  saleCreate: Joi.object({
    customerId: idSchema.allow(null),
    tableNumber: Joi.string().max(20).allow(''),
    orderType: Joi.string().valid('dine_in', 'takeaway', 'delivery', 'tab').default('dine_in'),
    items: Joi.array().items(
      Joi.object({
        productId: idSchema.required(),
        quantity: Joi.number().integer().min(1).required(),
        unitPrice: Joi.number().min(0).allow(null),
        notes: Joi.string().max(200).allow(''),
      })
    ).min(1).required(),
    paymentMethod: Joi.string().valid('cash', 'mpesa', 'card', 'bank_transfer', 'credit', 'voucher').required(),
    paymentStatus: Joi.string().valid('pending', 'completed', 'failed').default('completed'),
    mpesaTransactionId: Joi.string().max(50).allow(''),
    mpesaReceiptNumber: Joi.string().max(50).allow(''),
    isTaxInclusive: Joi.boolean().default(false),
    discountCode: Joi.string().max(20).allow(''),
    loyaltyPointsRedeemed: Joi.number().integer().min(0).default(0),
    notes: Joi.string().max(1000).allow(''),
  }),

  // Customer creation
  customer: Joi.object({
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    email: Joi.string().email().allow(''),
    phone: Joi.string().pattern(/^\+?254[0-9]{9}$|^07[0-9]{8}$/).required(),
    alternativePhone: Joi.string().pattern(/^\+?254[0-9]{9}$|^07[0-9]{8}$/).allow(''),
    dateOfBirth: Joi.date().iso().allow(null),
    gender: Joi.string().valid('male', 'female', 'other').allow(''),
    idType: Joi.string().valid('national_id', 'passport', 'alien_id', 'none').required(),
    idNumber: Joi.string().allow(''),
    address: Joi.object({
      street: Joi.string().max(200).allow(''),
      city: Joi.string().max(100).required(),
      county: Joi.string().max(100).required(),
      country: Joi.string().default('Kenya'),
      postalCode: Joi.string().max(10).allow(''),
    }).required(),
    tier: Joi.string().valid('regular', 'silver', 'gold', 'platinum', 'vip').default('regular'),
    creditLimit: Joi.number().min(0).default(0),
  }),

  // Credit transaction
  creditTransaction: Joi.object({
    customerId: idSchema.required(),
    amount: Joi.number().min(0.01).required(),
    type: Joi.string().valid('debit', 'credit', 'interest', 'fee').required(),
    description: Joi.string().min(1).max(500).required(),
    dueDate: Joi.date().iso().allow(null),
    referenceType: Joi.string().valid('sale', 'payment', 'adjustment', 'write_off', 'interest').required(),
    referenceId: idSchema.required(),
  }),

  // Expense
  expense: Joi.object({
    branchId: idSchema.required(),
    category: Joi.string().valid(
      'rent', 'utilities', 'salaries', 'marketing', 'inventory',
      'maintenance', 'license_renewal', 'taxes', 'transport', 'other'
    ).required(),
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).allow(''),
    amount: Joi.number().min(0).required(),
    paymentMethod: Joi.string().valid('cash', 'mpesa', 'card', 'bank_transfer', 'credit').required(),
    vendor: Joi.string().max(200).allow(''),
    vendorInvoiceNumber: Joi.string().max(100).allow(''),
    isRecurring: Joi.boolean().default(false),
    recurrenceInterval: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').allow(''),
    notes: Joi.string().max(1000).allow(''),
  }),

  // Supplier
  supplier: Joi.object({
    supplierCode: Joi.string().uppercase().min(3).max(20).required(),
    name: Joi.string().min(1).max(200).required(),
    contactPerson: Joi.object({
      firstName: Joi.string().min(1).max(50).required(),
      lastName: Joi.string().min(1).max(50).required(),
      phone: Joi.string().pattern(/^\+?254[0-9]{9}$|^07[0-9]{8}$/).required(),
      email: Joi.string().email().required(),
    }).required(),
    phone: Joi.string().pattern(/^\+?254[0-9]{9}$|^07[0-9]{8}$/).required(),
    email: Joi.string().email().allow(''),
    address: Joi.object({
      street: Joi.string().max(200).allow(''),
      city: Joi.string().max(100).required(),
      county: Joi.string().max(100).required(),
      country: Joi.string().default('Kenya'),
      postalCode: Joi.string().max(10).allow(''),
    }).required(),
    registrationNumber: Joi.string().max(50).allow(''),
    creditTerms: Joi.object({
      allowed: Joi.boolean().default(false),
      creditLimit: Joi.number().min(0).default(0),
      paymentTermsDays: Joi.number().min(0).default(0),
    }).default({}),
  }),

  // Purchase order
  purchase: Joi.object({
    supplierId: idSchema.required(),
    items: Joi.array().items(
      Joi.object({
        productId: idSchema.required(),
        orderedQty: Joi.number().integer().min(1).required(),
        unitCost: Joi.number().min(0).required(),
        batchNumber: Joi.string().max(50).allow(''),
        expiryDate: Joi.date().iso().allow(null),
        notes: Joi.string().max(200).allow(''),
      })
    ).min(1).required(),
    deliveryDate: Joi.date().iso().allow(null),
    notes: Joi.string().max(1000).allow(''),
  }),

  // Branch creation
  branch: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    code: Joi.string().uppercase().min(3).max(10).required(),
    address: Joi.object({
      city: Joi.string().max(100).required(),
      county: Joi.string().max(100).required(),
      country: Joi.string().default('Kenya'),
      postalCode: Joi.string().max(10).allow(''),
    }).required(),
    contact: Joi.object({
      phone: Joi.string().pattern(/^\+?254[0-9]{9}$|^07[0-9]{8}$/).required(),
      email: Joi.string().email().required(),
    }).required(),
    manager: idSchema.required(),
    timezone: Joi.string().default('Africa/Nairobi'),
    currency: Joi.string().default('KES'),
    licenseNumber: Joi.string().max(100).allow(''),
    licenseExpiry: Joi.date().iso().allow(null),
  }),

  // Report request
  report: Joi.object({
    type: Joi.string().valid(
      'sales_summary',
      'product_performance',
      'profit_margin',
      'staff_performance',
      'inventory_audit',
      'tax_report',
      'credit_aging',
      'customer_analytics'
    ).required(),
    branchId: idSchema.allow(null),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    productIds: Joi.array().items(idSchema).allow(null),
    categoryIds: Joi.array().items(idSchema).allow(null),
    staffIds: Joi.array().items(idSchema).allow(null),
    customerIds: Joi.array().items(idSchema).allow(null),
  }),
};

/**
 * Express middleware to validate request using Joi schema
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      return res.status(400).json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details,
      });
    }

    // Replace request body with sanitized value
    req.body = value;
    next();
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      return res.status(400).json({
        error: 'Invalid query parameters',
        code: 'INVALID_QUERY',
        details,
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Validate route parameters
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      return res.status(400).json({
        error: 'Invalid route parameters',
        code: 'INVALID_PARAMS',
        details,
      });
    }

    req.params = value;
    next();
  };
};

export default { schemas, validate, validateQuery, validateParams };
