# Active Context: Liquor Club Management System

## Current State

**Application Status**: ✅ Full implementation with MongoDB + Authentication + API + M-Pesa

A complete Liquor Club Management System with 11 functional pages, MongoDB database, JWT authentication, and M-Pesa integration.

## Recently Completed

- [x] **POS units not fetching - Critical Fix**: Resolved issue where alternate units were missing from cart dropdown due to isActive being undefined in legacy records; ensureUnitPrices now converts Mongoose subdocuments correctly using toObject() and backfills isActive, name, abbreviation, conversionFactor, isBase to safe defaults; sellPrice/costPrice also backfilled when zero (placeholder values)
- [x] **Alternate unit persistence & robustness**: Ensured sellPrice/costPrice always present for all units via API backfill; fixed edit crash for legacy units; added migration script for one-time DB fix; added unit tests for pricing logic
- [x] **Alternate unit editing**: Inline edit for alternate units in AddProductModal; modify name, conversion factor, sell price, cost price; includes validation and duplicate name checking
- [x] **Dynamic categories**: AddProductModal fetches categories from `/api/categories`; inline creation via POST
- [x] **Product grid removal**: POS interface simplified to header, customer selector, search dropdown, category filters, and order cart
- [x] **Product grid removal**: Completely removed products grid from POS; interface now consists of header, customer selector, search dropdown, category filters, and order cart that fills remaining viewport
- [x] **Cart table format**: Reordered cart item display into single-row table layout with columns: Item Name (col-span-4), Unit selector (col-span-2), Unit Price (col-span-2, right-aligned), Quantity controls (col-span-2, centered), Line Total Amount (col-span-1, right-aligned), and Delete button (col-span-1)
- [x] **Sale product highlighting**: Products on Happy Hour (Shot category) display with amber border/background, bold font, increased font size (+2pt), and "✨ Happy Hour" badge
- [x] **VAT-inclusive tax calculation**: Changed tax computation to extract VAT from gross (inclusive) prices using formula: Tax = Gross − (Gross ÷ 1.16); subtotal now stores net amount, total stores gross amount
- [x] **POS layout optimization**: Redesigned POS to maximize vertical space using ultra-compact horizontal layout (xs fonts, tight spacing, minimal padding), consolidated header into single row, and compact customer/order controls
- [x] Bright/Dark theme toggle with persistence and premium design
- [x] Fixed light theme by adding CSS variable overrides for `[data-theme="bright"]` in globals.css
- [x] POS/Billing page with touch-friendly interface, happy hour, split bills, tabs
- [x] **Enhanced Inventory** with real-time stock tracking, batch tracking, reorder alerts
- [x] **Inventory Management Service**: Comprehensive stock update service with automatic stock decrement on order completion, unit-aware stock management (UOM conversions), negative stock prevention, real-time audit logging, and reorder flagging
- [x] Bar/Drink Management with recipes, happy hour scheduling
- [x] Customer/Membership Management with loyalty tiers, credit tracking
- [x] Staff/User Management with roles, shifts, commission tracking
- [x] Reports/Analytics with sales charts, staff performance
- [x] Financial Management with income/expense tracking, P&L
- [x] Supplier Management with purchase orders, credit
- [x] Compliance/Regulatory with KRA excise, licenses, audit trails
- [x] Alerts & Notifications system
- [x] Settings page with POS, tax, business configuration
- [x] MongoDB database with Mongoose ODM
- [x] Seed script with sample data
- [x] AddProductModal - comprehensive multi-section form with validation, organized into Basic Info, Product Details, Pricing, Compliance, and Additional sections
- [x] Fixed corrupted inventory/page.tsx by removing duplicate code and separating modal components
- [x] Created standalone AddProductModal.tsx component with AddProductModal and EditProductModal exports
- [x] **Authentication System**: JWT-based auth with login/logout/refresh, User model with roles, protected middleware, AuthContext
- [x] **Real Backend API Routes**: Comprehensive REST API for all modules (Staff, Orders, Recipes, HappyHours, Licenses, Transactions, etc.)
- [x] **M-Pesa Integration**: STK Push with full callback handling, transaction tracking, environment config
- [x] **Category Manager**: Full CRUD for product categories with color picker, icon emoji, sort ordering, active flag, and dedicated UI page
- [x] **Favicon Update**: Updated favicon to use GlassWater icon from sidebar navigation, added SVG favicon to public directory
- [x] **Unit Selection in Shopping Cart**: Dynamic unit conversion dropdown (kg, g, lbs, oz, pieces, packs, sets) with real-time price/total updates, persisted throughout checkout process; includes database schema updates (OrderItem with unit, conversionFactor, unitPrice) and API integration with ProductUOM model
- [x] **Fixed unit price calculation**: Prices now correctly calculated based on base product price and unit conversion factor, eliminating rounding errors when switching between units
- [x] **Product persistence**: AddProductModal now saves products to database via `/api/products` POST (create) and PATCH (update); inventory page refetches after success; added PATCH/DELETE endpoints to products API; transformed API response to frontend format
- [x] **Inventory data loading**: Inventory page now loads products from database on mount, eliminating hardcoded data and ensuring proper MongoDB ObjectId handling for edit operations

## Current Structure

### Pages
| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Dashboard home | ✅ Ready |
| `src/app/layout.tsx` | Root layout with sidebar | ✅ Ready |
| `src/app/pos/page.tsx` | POS & Billing | ✅ Ready |
| `src/app/inventory/page.tsx` | Inventory & Stock Control | ✅ Ready |
| `src/app/drinks/page.tsx` | Bar & Drinks | ✅ Ready |
| `src/app/members/page.tsx` | Customers & Membership | ✅ Ready |
| `src/app/staff/page.tsx` | Staff Management | ✅ Ready |
| `src/app/reports/page.tsx` | Reports & Analytics | ✅ Ready |
| `src/app/financial/page.tsx` | Financial Management | ✅ Ready |
| `src/app/categories/page.tsx` | Category Manager | ✅ Ready |
| `src/app/suppliers/page.tsx` | Supplier Management | ✅ Ready |
| `src/app/compliance/page.tsx` | Compliance & Regulatory | ✅ Ready |
| `src/app/alerts/page.tsx` | Alerts & Notifications | ✅ Ready |
| `src/app/settings/page.tsx` | Settings | ✅ Ready |
| `src/app/login/page.tsx` | Login | ✅ Ready |

### API Routes
| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/login` | User login (JWT) |
| `GET /api/auth/me` | Get current user |
| `POST /api/auth/refresh` | Refresh access token |
| `POST /api/auth/logout` | Logout (clears cookie) |
| `GET/POST /api/categories` | Categories list/create |
| `GET/PATCH/DELETE /api/categories/[id]` | Category detail/update/delete |
| `GET/POST /api/staff` | Staff CRUD |
| `GET/POST /api/orders` | Orders with filters |
| `GET/POST /api/recipes` | Recipes list/create |
| `GET/PATCH/DELETE /api/recipes/[id]` | Recipe detail/update/delete |
| `GET/POST /api/happy-hours` | Happy hour schedules |
| `GET/PATCH/DELETE /api/happy-hours/[id]` | Individual happy hour |
| `GET/POST /api/licenses` | Licenses |
| `GET/PATCH/DELETE /api/licenses/[id]` | Individual license |
| `GET /api/transactions` | Financial transactions |
| `POST /api/transactions` | Create transaction |
| `POST /api/mpesa/stk-push` | Initiate M-Pesa payment |
| `POST /api/mpesa/callback` | M-Pesa webhook |

### Components
| File | Purpose |
|------|---------|
| `src/components/ThemeProvider.tsx` | Theme context (dark/bright) |
| `src/components/ThemeToggle.tsx` | Toggle button |
| `src/components/Sidebar.tsx` | Navigation sidebar with auth state |
| `src/components/AuthContext.tsx` | Auth state provider |
| `src/components/AddProductModal.tsx` | Multi-section product form with inline alternate unit editing |

### Utilities
| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | JWT token generation/verification, password utils |
| `src/lib/api.ts` | Authenticated fetch wrapper |
| `src/lib/mpesa.ts` | M-Pesa STK Push, callback handling |
| `src/lib/db/connection.ts` | MongoDB connection |
| `src/lib/db/models.ts` | All Mongoose schemas |
| `src/lib/db/seed.ts` | Seed script with demo data (includes users) |
| `src/lib/utils/uomPricing.ts` | ensureUnitPrices utility for backfill |
| `src/lib/db/migrations/backfill-unit-prices.ts` | One-time migration to fix legacy unit pricing data |
| `src/lib/services/inventoryService.ts` | Core inventory management service with stock updates, UOM conversions, audit logging, and reorder flagging |
| `src/lib/services/auditLogService.ts` | Audit logging utilities for inventory transactions |
| `src/types/inventory.d.ts` | Type definitions for inventory operations |

### Tests
| File | Purpose |
|------|---------|
| `src/__tests__/uomPricing.test.ts` | Unit tests for uomPricing utility |
| `src/__tests__/alternate-unit-persistence.test.ts` | Integration tests for unit persistence (create, update, backfill) |

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-04-20 | Full liquor club system implemented with 11 pages |
| 2026-04-20 | MongoDB database with Mongoose schemas |
| 2026-04-20 | Bright/Dark theme toggle with persistence |
| 2026-04-25 | Fixed light theme: Added CSS variable overrides for `[data-theme="bright"]` in globals.css |
| 2026-04-25 | Implemented AddProductModal with organized multi-section form, validation, and API integration |
| 2026-04-25 | **Added JWT authentication system** - User schema, token management, login/logout/refresh endpoints |
| 2026-04-25 | **Built comprehensive REST API** - Staff, Orders, Recipes, HappyHours, Licenses, Transactions |
| 2026-04-25 | **Integrated M-Pesa STK Push** - Initiation endpoint, callback webhook, transaction tracking |
| 2026-04-25 | **Fixed type errors** - bcryptjs types, NextRequest signatures, dynamic route handlers |
| 2026-04-25 | **Lint & typecheck passing** - Updated .eslintrc to ignore worktrees, added disables |
| 2026-04-26 | **Sidebar Redesign** - Clean white aesthetic with high-contrast green CTA buttons, 256px width, refined typography |
| 2026-04-26 | **Category Manager** - Added Category schema, CRUD API, UI page with color picker, icons, sorting, and sidebar navigation |
| 2026-04-26 | **Waiter Handover SOP** - Comprehensive Standard Operating Procedure for inventory accuracy and financial accountability with 6 standardized forms |
| 2026-04-26 | **Favicon Update** - Updated favicon to use GlassWater icon from sidebar navigation, added SVG favicon to public directory |
| 2026-04-27 | **Dynamic category fetching** - AddProductModal now fetches categories from `/api/categories` endpoint on mount; added loading state, disabled select during fetch, and inline category creation via POST request |
| 2026-04-27 | **Product persistence** - AddProductModal now saves products to database via `/api/products` POST (create) and PATCH (update); inventory page refetches products after success; added PATCH/DELETE endpoints to products API; transformed API response to frontend format |
| 2026-04-27 | **Inventory data loading** - Inventory page now loads products from database on mount using the products API, eliminating hardcoded data and ensuring proper MongoDB ObjectId handling for edit operations |
| 2026-04-27 | **Product persistence** - AddProductModal now saves products to database via `/api/products` POST (create) and PATCH (update); inventory page refetches products after success; added PATCH/DELETE endpoints to products API; transformed API response to frontend format |
| 2026-04-27 | **Inventory data loading** - Inventory page now loads products from database on mount using the products API, eliminating hardcoded data and ensuring proper MongoDB ObjectId handling for edit operations |
| 2026-04-27 | **Fixed search bar** - Added useMemo for filtered products, improved search with trim() and empty term handling; added useMemo dependency on products, searchTerm, and activeCategory |
| 2026-04-27 | **Inventory Management Service** - Created comprehensive inventory service with automatic stock updates on order completion, unit-aware UOM conversions, negative stock prevention, real-time audit logging, and reorder flagging; integrated into order API with Mongoose transactions |

## Quick Start Guide

### To start the dev server:
```bash
bun dev
```

### To seed the database:
```bash
bun run src/lib/db/seed.ts
```

### To run the unit backfill migration (fixes legacy alternate unit pricing):
```bash
bun run src/lib/db/migrations/backfill-unit-prices.ts
```

### To run tests:
```bash
bun test
```

### Default login:
- **Email:** admin@example.com
- **Password:** password123

### Features Implemented:
1. POS - Touch-friendly billing with happy hour, split bills, customer-based orders
2. Inventory - Real-time stock, batch tracking, reorder alerts
3. **Inventory Management Service** - Automatic stock updates on order completion, unit-aware stock management (UOM conversions), negative stock prevention, real-time audit logging, and reorder flagging
4. Drinks - Recipes, menu engineering, happy hour scheduling
5. Customers - Loyalty tiers (Bronze/Silver/Gold/VIP), credit limits, points
5. Staff - Roles, shifts, commission tracking
6. Reports - Sales charts, top products, staff performance
7. Financial - Income/expense tracking
8. Suppliers - Purchase orders, credit management
9. Compliance - KRA excise, licenses, audit trail
10. Alerts - Low stock, fraud detection, notifications
11. **Categories** - Visual category manager with color picker, icons, sorting, and active/inactive toggle
12. **Authentication** - JWT, role-based access control
13. **API** - REST endpoints for all modules
14. **M-Pesa** - STK Push integration ready

## Configuration

### Environment Variables
See `.env.example` for all required config:
- `JWT_SECRET`, `REFRESH_TOKEN_SECRET`
- `MONGODB_URI`
- `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE`, `MPESA_CALLBACK_URL`

## Pending Improvements

- [ ] Add real-time WebSocket updates
- [ ] Add file upload for receipts/documents
- [ ] Build admin dashboard UI for new API endpoints
- [ ] Implement IndexedDB offline sync for POS