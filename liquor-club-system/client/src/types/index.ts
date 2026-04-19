// types/index.ts

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'admin' | 'manager' | 'cashier' | 'bartender' | 'auditor' | 'waiter' | 'super_admin';
  branchId: string;
  employeeId: string;
  profilePicture?: string;
  permissions?: string[];
}

export interface Branch {
  _id: string;
  name: string;
  code: string;
  address: {
    street?: string;
    city: string;
    county: string;
    country: string;
    postalCode?: string;
  };
  contact: {
    phone: string;
    email: string;
  };
  manager: User;
  timezone: string;
  currency: string;
  isActive: boolean;
  licenseNumber?: string;
  licenseExpiry?: string;
  settings: {
    enableCreditSales: boolean;
    creditLimitDefault: number;
    enableLoyalty: boolean;
    loyaltyPointsPerKes: number;
    enableHappyHour: boolean;
    defaultPaymentMethods: string[];
    receiptHeader: string;
    receiptFooter: string;
    posTheme: 'light' | 'dark' | 'auto';
  };
  inventory: {
    lowStockThreshold: number;
    reorderPoint: number;
    autoReorder: boolean;
  };
}

export interface Product {
  _id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  origin?: string;
  alcoholContent?: number;
  volume: number;
  unitType: string;
  conversionRate: number;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  retailPrice?: number;
  barcode?: string;
  isActive: boolean;
  isAlcoholic: boolean;
  taxRate: number;
  exciseDuty: number;
  branchId: string;
  currentStock?: number;
  images?: string[];
}

export interface Sale {
  _id: string;
  saleNumber: string;
  branchId: string;
  cashierId: User;
  customerId?: Customer;
  tableNumber?: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery' | 'tab';
  status: 'draft' | 'pending' | 'completed' | 'cancelled' | 'refunded' | 'voided';
  items: Array<{
    productId: string;
    productSnapshot: {
      name: string;
      sku: string;
      sellingPrice: number;
      costPrice: number;
      unitType: string;
    };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discountAmount: number;
    notes?: string;
  }>;
  subtotal: number;
  taxAmount: number;
  exciseDutyAmount: number;
  discountTotal: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  mpesaTransactionId?: string;
  mpesaReceiptNumber?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  alternativePhone?: string;
  dateOfBirth?: string;
  gender?: string;
  tier: 'regular' | 'silver' | 'gold' | 'platinum' | 'vip';
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  credit: {
    currentBalance: number;
    creditLimit: number;
    creditStatus: 'good' | 'overdue' | 'bad' | 'blocked';
    creditSince: string;
  };
  address: {
    street?: string;
    city: string;
    county: string;
    country: string;
    postalCode?: string;
  };
  preferences: {
    favoriteProducts: Product[];
    preferredPaymentMethod?: string;
    communicationChannel: 'sms' | 'whatsapp' | 'email' | 'all';
    receivePromotions: boolean;
    preferredLanguage: 'en' | 'sw';
  };
  isActive: boolean;
}

export interface StockMovement {
  _id: string;
  productId: string;
  branchId: string;
  type: 'sale' | 'purchase' | 'transfer' | 'waste' | 'breakage' | 'spillage' | 'adjustment' | 'return' | 'initial_stock';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  referenceType: string;
  referenceId: string;
  batchNumber?: string;
  expiryDate?: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

export interface Expense {
  _id: string;
  expenseNumber: string;
  branchId: string;
  category:
    | 'rent'
    | 'utilities'
    | 'salaries'
    | 'marketing'
    | 'inventory'
    | 'maintenance'
    | 'license_renewal'
    | 'taxes'
    | 'transport'
    | 'other';
  title: string;
  description?: string;
  amount: number;
  paymentMethod: 'cash' | 'mpesa' | 'card' | 'bank_transfer' | 'credit';
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  paidAt?: string;
  vendor?: string;
  invoiceNumber?: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  branchId?: string;
  productIds?: string[];
  categoryIds?: string[];
  staffIds?: string[];
  customerIds?: string[];
  paymentMethods?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: { [key: string]: T };
  message?: string;
  error?: string;
  code?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
