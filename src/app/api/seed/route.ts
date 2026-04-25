import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Supplier, Customer, Product, Staff, Order, Recipe, Transaction } from "@/lib/db/models";

const seedSuppliers = [
  { name: "Kenya Breweries Ltd", contactPerson: "John Kamau", phone: "+254 20 123 456", email: "orders@kenyabrewers.co.ke", products: "Beer, Draft", totalOrders: 45, totalSpent: 450000, creditBalance: 0, rating: 4.5 },
  { name: "EABL", contactPerson: "Sarah Njoroge", phone: "+254 20 234 567", email: "sales@eabl.com", products: "Vodka, Whiskey, Gin", totalOrders: 38, totalSpent: 680000, creditBalance: 85000, rating: 4.8 },
  { name: "French Wines Co", contactPerson: "Pierre Dubois", phone: "+254 72 345 678", email: "info@frenchwines.co.ke", products: "Wine, Champagne", totalOrders: 12, totalSpent: 180000, creditBalance: 45000, rating: 4.2 },
  { name: "MexImports Ltd", contactPerson: "Carlos Rodriguez", phone: "+254 73 456 789", email: "orders@mex-imports.com", products: "Tequila, Mexican Spirits", totalOrders: 15, totalSpent: 95000, creditBalance: 0, rating: 4.0 },
  { name: "Bottlers Kenya", contactPerson: "Mary Wanjiku", phone: "+254 20 345 678", email: "orders@bottlers.co.ke", products: "Soft Drinks, Mixers", totalOrders: 52, totalSpent: 120000, creditBalance: 0, rating: 4.6 },
  { name: "Crystal Springs", contactPerson: "David Ochieng", phone: "+254 75 567 890", email: "sales@crystalsprings.co.ke", products: "Water, Ice", totalOrders: 30, totalSpent: 45000, creditBalance: 5000, rating: 3.8, status: "Inactive" },
];

const seedCustomers = [
  { name: "Walk-in Customer", phone: "", tier: "Bronze", creditLimit: 0, creditUsed: 0, points: 0, totalSpent: 0, visits: 0 },
  { name: "John Doe", phone: "+254 712 345 678", email: "john@example.com", tier: "Gold", creditLimit: 10000, creditUsed: 2500, points: 4500, totalSpent: 85000, visits: 15 },
  { name: "Jane Smith", phone: "+254 723 456 789", email: "jane@example.com", tier: "VIP", creditLimit: 50000, creditUsed: 12000, points: 15000, totalSpent: 180000, visits: 42 },
  { name: "Mike Johnson", phone: "+254 734 567 890", email: "mike@example.com", tier: "Silver", creditLimit: 5000, creditUsed: 0, points: 1850, totalSpent: 28000, visits: 8 },
  { name: "Sarah Williams", phone: "+254 745 678 901", email: "sarah@example.com", tier: "Bronze", creditLimit: 2000, creditUsed: 0, points: 280, totalSpent: 5500, visits: 3 },
  { name: "Tom Brown", phone: "+254 756 789 012", email: "tom@example.com", tier: "Gold", creditLimit: 15000, creditUsed: 3000, points: 6500, totalSpent: 72000, visits: 18 },
  { name: "Emily Davis", phone: "+254 767 890 123", email: "emily@example.com", tier: "VIP", creditLimit: 30000, creditUsed: 8000, points: 10500, totalSpent: 145000, visits: 35 },
];

const seedProducts = [
  { name: "Jack Daniel's", category: "Bourbon", stock: 24, costPrice: 250, sellPrice: 300, supplier: "EABL", reorderLevel: 10, status: "In Stock" },
  { name: "Grey Goose", category: "Vodka", stock: 18, costPrice: 380, sellPrice: 450, supplier: "EABL", reorderLevel: 10, status: "In Stock" },
  { name: "Johnnie Walker", category: "Scotch", stock: 12, costPrice: 420, sellPrice: 500, supplier: "EABL", reorderLevel: 8, status: "In Stock" },
  { name: "Moet & Chandon", category: "Champagne", stock: 6, costPrice: 1000, sellPrice: 1200, supplier: "French Wines Co", reorderLevel: 5, status: "Low Stock" },
  { name: "Hennessy VS", category: "Cognac", stock: 15, costPrice: 340, sellPrice: 400, supplier: "EABL", reorderLevel: 10, status: "In Stock" },
  { name: "Patron Silver", category: "Tequila", stock: 20, costPrice: 380, sellPrice: 450, supplier: "MexImports Ltd", reorderLevel: 10, status: "In Stock" },
  { name: "Heineken (Draft)", category: "Beer", stock: 50, costPrice: 120, sellPrice: 150, supplier: "Kenya Breweries Ltd", reorderLevel: 20, status: "In Stock" },
  { name: "Guinness", category: "Beer", stock: 30, costPrice: 160, sellPrice: 200, supplier: "Kenya Breweries Ltd", reorderLevel: 15, status: "In Stock" },
  { name: "Jameson", category: "Irish", stock: 16, costPrice: 290, sellPrice: 350, supplier: "EABL", reorderLevel: 10, status: "In Stock" },
  { name: "Vodka Pump", category: "Shot", stock: 100, costPrice: 80, sellPrice: 100, supplier: "EABL", reorderLevel: 30, status: "In Stock" },
  { name: "Tequila Shot", category: "Shot", stock: 80, costPrice: 120, sellPrice: 150, supplier: "MexImports Ltd", reorderLevel: 25, status: "In Stock" },
  { name: "Rum Shot", category: "Shot", stock: 75, costPrice: 120, sellPrice: 150, supplier: "EABL", reorderLevel: 25, status: "In Stock" },
  { name: "Wine (Glass)", category: "Wine", stock: 24, costPrice: 200, sellPrice: 250, supplier: "French Wines Co", reorderLevel: 10, status: "In Stock" },
  { name: "Soda", category: "Mixer", stock: 100, costPrice: 40, sellPrice: 50, supplier: "Bottlers Kenya", reorderLevel: 30, status: "In Stock" },
  { name: "Energy Drink", category: "Mixer", stock: 40, costPrice: 120, sellPrice: 150, supplier: "Bottlers Kenya", reorderLevel: 15, status: "In Stock" },
  { name: "Tonic Water", category: "Mixer", stock: 36, costPrice: 65, sellPrice: 80, supplier: "Bottlers Kenya", reorderLevel: 12, status: "In Stock" },
];

const seedStaff = [
  { name: "James Wilson", role: "Manager", phone: "+254 711 111 111", email: "james@club.com", shift: "Morning", hireDate: new Date("2022-01-15"), totalSales: 450000, commission: 22500 },
  { name: "Mary Okonkwo", role: "Cashier", phone: "+254 722 222 222", email: "mary@club.com", shift: "Evening", hireDate: new Date("2022-03-20"), totalSales: 320000, commission: 16000 },
  { name: "David Kiprop", role: "Bartender", phone: "+254 733 333 333", email: "david@club.com", shift: "Night", hireDate: new Date("2022-06-10"), totalSales: 280000, commission: 14000 },
  { name: "Faith Kemunto", role: "Waiter", phone: "+254 744 444 444", email: "faith@club.com", shift: "Evening", hireDate: new Date("2023-01-05"), totalSales: 180000, commission: 9000 },
  { name: "Grace Akinyi", role: "Bartender", phone: "+254 755 555 555", email: "grace@club.com", shift: "Morning", hireDate: new Date("2023-04-12"), totalSales: 210000, commission: 10500 },
  { name: "Paul Ochieng", role: "Admin", phone: "+254 766 666 666", email: "paul@club.com", shift: "Morning", hireDate: new Date("2021-08-01"), totalSales: 0, commission: 0 },
];

export async function POST() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("Connected, seeding data...");
    
    // Clear existing data and seed fresh
    await Supplier.deleteMany({});
    await Customer.deleteMany({});
    await Product.deleteMany({});
    await Staff.deleteMany({});
    await Recipe.deleteMany({});
    await Transaction.deleteMany({});
    
    await Supplier.insertMany(seedSuppliers);
    await Customer.insertMany(seedCustomers);
    await Product.insertMany(seedProducts);
    await Staff.insertMany(seedStaff);
    
    return NextResponse.json({ 
      message: "Database seeded successfully",
      suppliers: seedSuppliers.length,
      customers: seedCustomers.length,
      products: seedProducts.length,
      staff: seedStaff.length
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}