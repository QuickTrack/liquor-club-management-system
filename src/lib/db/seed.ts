import { connectDB } from "./connection";
import {
  Customer,
  Product,
  Staff,
  Supplier,
  Recipe,
  Transaction,
  License,
  HappyHour,
  User,
  IHappyHour,
  IRecipe,
  IProduct,
  ICustomer,
  IStaff,
  ISupplier,
  ITransaction,
  ILicense,
  IUser,
} from "./models";

const seedData = async () => {
  console.log("🌱 Starting database seed...");

  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Customer.deleteMany({});
    await Product.deleteMany({});
    await Staff.deleteMany({});
    await User.deleteMany({});
    await Supplier.deleteMany({});
    await Recipe.deleteMany({});
    await Transaction.deleteMany({});
    await License.deleteMany({});
    await HappyHour.deleteMany({});
    console.log("🗑️ Cleared existing data");

    // ==========================================
    // SEED CUSTOMERS
    // ==========================================
    const customers: Partial<ICustomer>[] = [
      { name: "Walk-in Customer", phone: "", tier: "Bronze", creditLimit: 0, creditUsed: 0, points: 0, status: "Active" },
      { name: "John Doe", phone: "+254 712 345 678", email: "john@example.com", tier: "Gold", creditLimit: 10000, creditUsed: 2500, points: 4500, totalSpent: 45000, visits: 25, status: "Active", preferences: "Whiskey, Bourbon" },
      { name: "Jane Smith", phone: "+254 723 456 789", email: "jane@example.com", tier: "VIP", creditLimit: 50000, creditUsed: 12000, points: 15000, totalSpent: 120000, visits: 58, status: "Active", preferences: "Champagne, Cocktails" },
      { name: "Mike Johnson", phone: "+254 734 567 890", email: "mike@example.com", tier: "Silver", creditLimit: 5000, creditUsed: 0, points: 1850, totalSpent: 18500, visits: 12, status: "Active", preferences: "Beer, Shots" },
      { name: "Sarah Williams", phone: "+254 745 678 901", email: "sarah@example.com", tier: "Bronze", creditLimit: 2000, creditUsed: 0, points: 280, totalSpent: 2800, visits: 3, status: "Inactive", preferences: "Wine" },
      { name: "Tom Brown", phone: "+254 756 789 012", email: "tom@example.com", tier: "Gold", creditLimit: 15000, creditUsed: 3000, points: 6500, totalSpent: 65000, visits: 35, status: "Active", preferences: "Vodka, Cocktails" },
      { name: "Emily Davis", phone: "+254 767 890 123", email: "emily@example.com", tier: "VIP", creditLimit: 30000, creditUsed: 8000, points: 10500, totalSpent: 85000, visits: 42, status: "Active", preferences: "Tequila, Shots" },
    ];

    const customerDocs = await Customer.insertMany(customers);
    console.log(`✅ Seeded ${customerDocs.length} customers`);

    // ==========================================
    // SEED PRODUCTS (INVENTORY)
    // ==========================================
    const products: Partial<IProduct>[] = [
      { name: "Jack Daniel's Old No. 7", category: "Bourbon", stock: 24, unit: "bottles", reorderLevel: 10, costPrice: 2000, sellPrice: 3000, supplier: "Kenya Breweries", status: "In Stock" },
      { name: "Grey Goose Vodka", category: "Vodka", stock: 18, unit: "bottles", reorderLevel: 10, costPrice: 3000, sellPrice: 4500, supplier: "EABL", status: "In Stock" },
      { name: "Moet & Chandon", category: "Champagne", stock: 0, unit: "bottles", reorderLevel: 5, costPrice: 8000, sellPrice: 12000, supplier: "French Wines", status: "Out of Stock" },
      { name: "Johnnie Walker Blue", category: "Scotch", stock: 12, unit: "bottles", reorderLevel: 8, costPrice: 15000, sellPrice: 20000, supplier: "EABL", status: "In Stock" },
      { name: "Patron Silver Tequila", category: "Tequila", stock: 6, unit: "bottles", reorderLevel: 10, costPrice: 3500, sellPrice: 4500, supplier: "MexImports", status: "Low Stock" },
      { name: "Hennessy VS", category: "Cognac", stock: 8, unit: "bottles", reorderLevel: 10, costPrice: 2800, sellPrice: 4000, supplier: "EABL", status: "Low Stock" },
      { name: "Heineken Draft", category: "Beer", stock: 50, unit: "kegs", reorderLevel: 20, costPrice: 2500, sellPrice: 3500, supplier: "Kenya Breweries", status: "In Stock" },
      { name: "Guinness", category: "Beer", stock: 30, unit: "crates", reorderLevel: 15, costPrice: 1800, sellPrice: 2500, supplier: "Kenya Breweries", status: "In Stock" },
      { name: "Vodka Shots", category: "Shots", stock: 200, unit: "shots", reorderLevel: 100, costPrice: 50, sellPrice: 100, supplier: "EABL", status: "In Stock" },
      { name: "Tequila Shots", category: "Shots", stock: 80, unit: "shots", reorderLevel: 100, costPrice: 80, sellPrice: 150, supplier: "MexImports", status: "Low Stock" },
      { name: "Jameson Irish Whiskey", category: "Irish", stock: 16, unit: "bottles", reorderLevel: 8, costPrice: 2500, sellPrice: 3500, supplier: "EABL", status: "In Stock" },
      { name: "White Rum", category: "Rum", stock: 20, unit: "bottles", reorderLevel: 10, costPrice: 2000, sellPrice: 2800, supplier: "EABL", status: "In Stock" },
      { name: "Gin", category: "Gin", stock: 15, unit: "bottles", reorderLevel: 8, costPrice: 2200, sellPrice: 3000, supplier: "EABL", status: "In Stock" },
      { name: "Soda", category: "Mixer", stock: 100, unit: "bottles", reorderLevel: 30, costPrice: 30, sellPrice: 50, supplier: "Bottlers Kenya", status: "In Stock" },
      { name: "Energy Drink", category: "Mixer", stock: 40, unit: "cans", reorderLevel: 15, costPrice: 100, sellPrice: 150, supplier: "Bottlers Kenya", status: "In Stock" },
      { name: "Tonic Water", category: "Mixer", stock: 36, unit: "bottles", reorderLevel: 15, costPrice: 50, sellPrice: 80, supplier: "Bottlers Kenya", status: "In Stock" },
    ];

    const productDocs = await Product.insertMany(products);
    console.log(`✅ Seeded ${productDocs.length} products`);

    // ==========================================
    // SEED STAFF
    // ==========================================
    const staff: Partial<IStaff>[] = [
      { name: "James Wilson", role: "Admin", phone: "+254 700 111 111", email: "james@club.com", shift: "Morning", hireDate: new Date("2023-01-15"), totalSales: 0, commission: 0, status: "Active" },
      { name: "Mary Okonkwo", role: "Manager", phone: "+254 700 222 222", email: "mary@club.com", shift: "Evening", hireDate: new Date("2023-03-20"), totalSales: 0, commission: 0, status: "Active" },
      { name: "David Kiprop", role: "Cashier", phone: "+254 700 333 333", email: "david@club.com", shift: "Evening", hireDate: new Date("2023-06-10"), totalSales: 156000, commission: 15600, status: "Active" },
      { name: "Faith Kemunto", role: "Bartender", phone: "+254 700 444 444", email: "faith@club.com", shift: "Evening", hireDate: new Date("2023-08-05"), totalSales: 98000, commission: 9800, status: "Active" },
      { name: "Paul Ochieng", role: "Bartender", phone: "+254 700 555 555", email: "paul@club.com", shift: "Night", hireDate: new Date("2023-09-12"), totalSales: 124000, commission: 12400, status: "Active" },
      { name: "Grace Akinyi", role: "Waiter", phone: "+254 700 666 666", email: "grace@club.com", shift: "Evening", hireDate: new Date("2024-01-08"), totalSales: 45000, commission: 4500, status: "Active" },
    ];

    const staffDocs = await Staff.insertMany(staff);
    console.log(`✅ Seeded ${staffDocs.length} staff members`);

    // ==========================================
    // SEED USERS (AUTHENTICATION)
    // ==========================================
    const bcrypt = require("bcryptjs");
    
    // Hash password: "password123"
    const defaultPassword = await bcrypt.hash("password123", 12);
    
    const users: Partial<IUser>[] = [
      {
        email: "admin@example.com",
        password: defaultPassword,
        name: "Super Admin",
        role: "Super Admin",
        phone: "+254 700 000 000",
        branchId: "001",
        isActive: true,
      },
      {
        email: "james@club.com",
        password: defaultPassword,
        name: "James Wilson",
        role: "Admin",
        phone: "+254 700 111 111",
        branchId: "001",
        isActive: true,
      },
      {
        email: "mary@club.com",
        password: defaultPassword,
        name: "Mary Okonkwo",
        role: "Manager",
        phone: "+254 700 222 222",
        branchId: "001",
        isActive: true,
      },
      {
        email: "david@club.com",
        password: defaultPassword,
        name: "David Kiprop",
        role: "Cashier",
        phone: "+254 700 333 333",
        branchId: "001",
        isActive: true,
      },
      {
        email: "faith@club.com",
        password: defaultPassword,
        name: "Faith Kemunto",
        role: "Bartender",
        phone: "+254 700 444 444",
        branchId: "001",
        isActive: true,
      },
      {
        email: "paul@club.com",
        password: defaultPassword,
        name: "Paul Ochieng",
        role: "Bartender",
        phone: "+254 700 555 555",
        branchId: "001",
        isActive: true,
      },
      {
        email: "grace@club.com",
        password: defaultPassword,
        name: "Grace Akinyi",
        role: "Waiter",
        phone: "+254 700 666 666",
        branchId: "001",
        isActive: true,
      },
    ];

    const userDocs = await User.insertMany(users);
    console.log(`✅ Seeded ${userDocs.length} users`);

    // ==========================================
    // SEED SUPPLIERS
    // ==========================================
    const suppliers: Partial<ISupplier>[] = [
      { name: "Kenya Breweries Ltd", contactPerson: "John Kamau", phone: "+254 20 123 456", email: "orders@kenyabrewers.co.ke", products: "Beer, Draft", totalOrders: 45, totalSpent: 450000, creditBalance: 0, rating: 4.5, status: "Active" },
      { name: "EABL", contactPerson: "Sarah Njoroge", phone: "+254 20 234 567", email: "sales@eabl.com", products: "Vodka, Whiskey, Gin", totalOrders: 38, totalSpent: 680000, creditBalance: 85000, rating: 4.8, status: "Active" },
      { name: "French Wines Co", contactPerson: "Pierre Dubois", phone: "+254 72 345 678", email: "info@frenchwines.co.ke", products: "Wine, Champagne", totalOrders: 12, totalSpent: 180000, creditBalance: 45000, rating: 4.2, status: "Active" },
      { name: "MexImports Ltd", contactPerson: "Carlos Rodriguez", phone: "+254 73 456 789", email: "orders@mex-imports.com", products: "Tequila, Mexican Spirits", totalOrders: 15, totalSpent: 95000, creditBalance: 0, rating: 4.0, status: "Active" },
      { name: "Bottlers Kenya", contactPerson: "Mary Wanjiku", phone: "+254 20 345 678", email: "orders@bottlers.co.ke", products: "Soft Drinks, Mixers", totalOrders: 52, totalSpent: 120000, creditBalance: 0, rating: 4.6, status: "Active" },
      { name: "Crystal Springs", contactPerson: "David Ochieng", phone: "+254 75 567 890", email: "sales@crystalsprings.co.ke", products: "Water, Ice", totalOrders: 30, totalSpent: 45000, creditBalance: 5000, rating: 3.8, status: "Inactive" },
    ];

    const supplierDocs = await Supplier.insertMany(suppliers);
    console.log(`✅ Seeded ${supplierDocs.length} suppliers`);

    // ==========================================
    // SEED RECIPES
    // ==========================================
    const recipes: Partial<IRecipe>[] = [
      { name: "Classic Margherita", category: "Cocktail", price: 450, ingredients: [{ name: "Patron Silver", amount: "1.5", unit: "oz" }, { name: "Lime Juice", amount: "1", unit: "oz" }, { name: "Agave Syrup", amount: "0.5", unit: "oz" }], prepTime: 3, isAvailable: true, soldToday: 12, revenue: 5400 },
      { name: "Mojito", category: "Cocktail", price: 400, ingredients: [{ name: "White Rum", amount: "2", unit: "oz" }, { name: "Mint Leaves", amount: "6", unit: "pcs" }, { name: "Lime Juice", amount: "1", unit: "oz" }, { name: "Sugar", amount: "0.5", unit: "oz" }], prepTime: 4, isAvailable: true, soldToday: 8, revenue: 3200 },
      { name: "Whiskey Sour", category: "Cocktail", price: 450, ingredients: [{ name: "Jack Daniel's", amount: "2", unit: "oz" }, { name: "Lemon Juice", amount: "1", unit: "oz" }, { name: "Sugar Syrup", amount: "0.75", unit: "oz" }], prepTime: 3, isAvailable: true, soldToday: 5, revenue: 2250 },
      { name: "Martini", category: "Cocktail", price: 500, ingredients: [{ name: "Gin", amount: "2.5", unit: "oz" }, { name: "Dry Vermouth", amount: "0.5", unit: "oz" }], prepTime: 2, isAvailable: true, soldToday: 15, revenue: 7500 },
      { name: "Pina Colada", category: "Cocktail", price: 500, ingredients: [{ name: "White Rum", amount: "2", unit: "oz" }, { name: "Coconut Cream", amount: "2", unit: "oz" }, { name: "Pineapple Juice", amount: "4", unit: "oz" }], prepTime: 4, isAvailable: true, soldToday: 6, revenue: 3000 },
      { name: "Vodka Tonic", category: "Simple", price: 250, ingredients: [{ name: "Vodka", amount: "1.5", unit: "oz" }, { name: "Tonic Water", amount: "4", unit: "oz" }], prepTime: 1, isAvailable: true, soldToday: 25, revenue: 6250 },
    ];

    const recipeDocs = await Recipe.insertMany(recipes);
    console.log(`✅ Seeded ${recipeDocs.length} recipes`);

    // ==========================================
    // SEED TRANSACTIONS
    // ==========================================
    const transactions: Partial<ITransaction>[] = [
      { type: "income", category: "Sales", amount: 45000, description: "Bar Sales - Friday", date: new Date("2024-07-15"), status: "Completed" },
      { type: "expense", category: "Rent", amount: 25000, description: "July Rent", date: new Date("2024-07-01"), status: "Completed" },
      { type: "income", category: "Sales", amount: 38000, description: "Bar Sales - Saturday", date: new Date("2024-07-14"), status: "Completed" },
      { type: "expense", category: "Utilities", amount: 8500, description: "Electricity Bill", date: new Date("2024-07-10"), status: "Completed" },
      { type: "expense", category: "Supplies", amount: 12000, description: "Stock Replenishment", date: new Date("2024-07-12"), status: "Completed" },
      { type: "income", category: "Sales", amount: 52000, description: "Bar Sales - Thursday", date: new Date("2024-07-13"), status: "Completed" },
      { type: "expense", category: "Salaries", amount: 85000, description: "Staff Wages", date: new Date("2024-07-15"), status: "Completed" },
      { type: "income", category: "Credit", amount: 15000, description: "Credit Payment - Jane Smith", date: new Date("2024-07-14"), status: "Completed" },
    ];

    const transactionDocs = await Transaction.insertMany(transactions);
    console.log(`✅ Seeded ${transactionDocs.length} transactions`);

    // ==========================================
    // SEED LICENSES
    // ==========================================
    const licenses: Partial<ILicense>[] = [
      { name: "Liquor License", type: "Alcohol", licenseNumber: "Liq/2024/001", issueDate: new Date("2024-01-01"), expiryDate: new Date("2025-01-01"), status: "Valid" },
      { name: "Health Permit", type: "Health", licenseNumber: "HP/2024/001", issueDate: new Date("2024-01-15"), expiryDate: new Date("2025-01-15"), status: "Valid" },
      { name: "Food Handler Permit", type: "Health", issueDate: new Date("2024-03-01"), expiryDate: new Date("2024-09-01"), status: "Expiring Soon" },
      { name: "Music License", type: "Copyright", issueDate: new Date("2024-01-01"), expiryDate: new Date("2025-01-01"), status: "Valid" },
      { name: "Outdoor Advertising", type: "Local Authority", issueDate: new Date("2024-02-01"), expiryDate: new Date("2024-08-01"), status: "Expired" },
    ];

    const licenseDocs = await License.insertMany(licenses);
    console.log(`✅ Seeded ${licenseDocs.length} licenses`);

    // ==========================================
    // SEED HAPPY HOURS
    // ==========================================
    const happyHours: Partial<IHappyHour>[] = [
      { day: "Monday", startTime: "14:00", endTime: "18:00", discount: 20, isActive: true },
      { day: "Wednesday", startTime: "14:00", endTime: "18:00", discount: 20, isActive: true },
      { day: "Friday", startTime: "14:00", endTime: "18:00", discount: 20, isActive: true },
      { day: "Saturday", startTime: "12:00", endTime: "16:00", discount: 15, isActive: true },
    ];

    const happyHourDocs = await HappyHour.insertMany(happyHours);
    console.log(`✅ Seeded ${happyHourDocs.length} happy hour schedules`);

    console.log("🎉 Database seeding completed!");
    console.log("");
    console.log("📊 Collection Summary:");
    console.log(`   - Customers: ${customerDocs.length}`);
    console.log(`   - Products: ${productDocs.length}`);
    console.log(`   - Staff: ${staffDocs.length}`);
    console.log(`   - Users: ${userDocs.length}`);
    console.log(`   - Suppliers: ${supplierDocs.length}`);
    console.log(`   - Recipes: ${recipeDocs.length}`);
    console.log(`   - Transactions: ${transactionDocs.length}`);
    console.log(`   - Licenses: ${licenseDocs.length}`);
    console.log(`   - Happy Hours: ${happyHourDocs.length}`);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
};

seedData();