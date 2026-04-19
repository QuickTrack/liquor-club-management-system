// Application-wide constants and enums

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  BARTENDER: 'bartender',
  AUDITOR: 'auditor',
  WAITER: 'waiter',
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  ON_LEAVE: 'on_leave',
} as const;

export const PRODUCT_CATEGORIES = {
  BEER: 'beer',
  WINE: 'wine',
  SPIRITS: 'spirits',
  LIQUEUR: 'liqueur',
  COCKTAIL: 'cocktail',
  READY_TO_DRINK: 'ready_to_drink',
  NON_ALCOHOLIC: 'non_alcoholic',
  TOBACCO: 'tobacco',
  SNACKS: 'snacks',
  MERCHANDISE: 'merchandise',
} as const;

export const UNIT_TYPES = {
  BOTTLE: 'bottle',
  CRATE: 'crate',
  CARTON: 'carton',
  SHOT: 'shot',
  GLASS: 'glass',
  PINT: 'pint',
  LITRE: 'litre',
  ML: 'ml',
  CAN: 'can',
  KEG: 'keg',
  CASE: 'case',
} as const;

export const STOCK_MOVEMENT_TYPES = {
  SALE: 'sale',
  PURCHASE: 'purchase',
  TRANSFER: 'transfer',
  WASTE: 'waste',
  BREAKAGE: 'breakage',
  SPILLAGE: 'spillage',
  ADJUSTMENT: 'adjustment',
  RETURN: 'return',
  INITIAL_STOCK: 'initial_stock',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  MPESA: 'mpesa',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  CREDIT: 'credit',
  VOUCHER: 'voucher',
  HYPPAY: 'hyppay',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
  CANCELLED: 'cancelled',
} as const;

export const SALE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  VOIDED: 'voided',
} as const;

export const CUSTOMER_TIERS = {
  REGULAR: 'regular',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  VIP: 'vip',
} as const;

export const CREDIT_STATUS = {
  GOOD: 'good',           // 0-30 days
  OVERDUE: 'overdue',     // 31-60 days
  BAD: 'bad',             // 60+ days
  BLOCKED: 'blocked',     // credit blocked
} as const;

export const EXPENSE_CATEGORIES = {
  RENT: 'rent',
  UTILITIES: 'utilities',
  SALARIES: 'salaries',
  MARKETING: 'marketing',
  INVENTORY: 'inventory',
  MAINTENANCE: 'maintenance',
  LICENSE_RENEWAL: 'license_renewal',
  TAXES: 'taxes',
  TRANSPORT: 'transport',
  OTHER: 'other',
} as const;

export const PURCHASE_STATUS = {
  DRAFT: 'draft',
  ORDERED: 'ordered',
  RECEIVED: 'received',
  INVOICED: 'invoiced',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const;

export const REPORT_TYPES = {
  DAILY_SALES: 'daily_sales',
  PRODUCT_PERFORMANCE: 'product_performance',
  PROFIT_MARGIN: 'profit_margin',
  STAFF_PERFORMANCE: 'staff_performance',
  INVENTORY_AUDIT: 'inventory_audit',
  TAX_REPORT: 'tax_report',
  CREDIT_AGING: 'credit_aging',
  CUSTOMER_ANALYTICS: 'customer_analytics',
} as const;

export const HAPPY_HOUR_TYPES = {
  FIXED_DISCOUNT: 'fixed_discount',   // e.g., 20% off
  FIXED_PRICE: 'fixed_price',         // e.g., KES 300 any drink
  BUY_X_GET_Y: 'buy_x_get_y',         // e.g., Buy 2 get 1 free
  TIME_BASED: 'time_based',           // e.g., 4-7 PM only
  DAY_BASED: 'day_based',             // e.g., Ladies night Wednesday
} as const;

export const AUDIT_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  APPROVE: 'approve',
  REJECT: 'reject',
  PRINT: 'print',
  EXPORT: 'export',
  PAYMENT: 'payment',
  REFUND: 'refund',
  TRANSFER: 'transfer',
  ADJUSTMENT: 'adjustment',
  CREDIT: 'credit',
} as const;

export const KENYA_SPECIFIC = {
  CURRENCY: 'KES',
  COUNTRY: 'Kenya',
  VAT_RATE: 16,
  EXCISE_DUTY_BEER: 120, // per litre
  EXCISE_DUTY_WINE: 100, // per litre
  EXCISE_DUTY_SPIRITS: 300, // per litre
  EXCISE_DUTY_CIDER: 80, // per litre
  MIN_AGE: 18,
  DEFAULT_BRANCH_CODE: '001',
} as const;

// Helper to get excise duty based on product category
export const getExciseDutyRate = (category) => {
  switch (category) {
    case PRODUCT_CATEGORIES.BEER:
      return KENYA_SPECIFIC.EXCISE_DUTY_BEER;
    case PRODUCT_CATEGORIES.WINE:
      return KENYA_SPECIFIC.EXCISE_DUTY_WINE;
    case PRODUCT_CATEGORIES.SPIRITS:
    case PRODUCT_CATEGORIES.LIQUEUR:
      return KENYA_SPECIFIC.EXCISE_DUTY_SPIRITS;
    case PRODUCT_CATEGORIES.COCKTAIL:
      if (category.includes('cider')) return KENYA_SPECIFIC.EXCISE_DUTY_CIDER;
      return KENYA_SPECIFIC.EXCISE_DUTY_SPIRITS;
    default:
      return 0;
  }
};

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;

// Cache keys for Redis (if added later)
export const CACHE_KEYS = {
  PRODUCT: (id) => `product:${id}`,
  PRODUCTS_LIST: 'products:all',
  SALES_SUMMARY: (branchId, date) => `sales:${branchId}:${date}`,
  STOCK_LEVEL: (productId, branchId) => `stock:${productId}:${branchId}`,
  LOW_STOCK_ALERTS: 'alerts:low_stock',
  DAILY_SUMMARY: (branchId, date) => `daily:${branchId}:${date}`,
} as const;
