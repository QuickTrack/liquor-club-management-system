# Liquor Club Management System

Comprehensive bar, lounge, and liquor club management system built for the Kenyan market with M-Pesa integration, offline-first capabilities, inventory control, and compliance features.

## 🏗️ Architecture

- **Frontend**: React + Vite + Tailwind CSS + Zustand
- **Backend**: Node.js + Express + Mongoose + MongoDB
- **Authentication**: JWT with refresh tokens, role-based access control
- **Payments**: M-Pesa (Daraja API), Cash, Card support
- **Deployment**: Docker-ready, supports any cloud provider

## 📦 Core Modules

1. **Point of Sale (POS)** – Fast, touch-friendly, offline-capable
2. **Inventory Management** – Real-time stock, conversions, batch tracking
3. **Customer & Membership** – Loyalty, credit ("weka kwa book"), VIP tiers
4. **Staff & User Management** – Roles, shifts, biometric/PIN login
5. **Financial Management** – Expenses, P&L, cash flow, KRA compliance
6. **Supplier & Procurement** – Orders, credit purchases, price comparison
7. **Reporting & Analytics** – Sales, margins, staff performance, inventory audit
8. **Compliance & Regulatory** – Excise duty, age verification, audit trails
9. **Multi-Branch Support** – Centralized dashboard, inter-branch transfers
10. **Alerts & Automation** – Low stock, daily summaries, fraud detection
11. **M-Pesa Integration** – STK Push, till/paybill reconciliation
12. **SMS Notifications** – Credit reminders, promotions via Africa's Talking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Bun (recommended)

### Installation

```bash
# Clone and install all dependencies
git clone <repo-url>
cd liquor-club-system
npm run install:all
```

### Environment Setup

```bash
# Copy environment files
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env.local

# Edit each .env file with your credentials
# - MongoDB URI
# - M-Pesa Daraja credentials
# - SMS provider keys
# - JWT secrets
```

### Development

```bash
# Run both frontend and backend concurrently
npm run dev

# Or separately:
cd server && npm run dev   # Backend on http://localhost:5000
cd client && npm run dev   # Frontend on http://localhost:5173
```

### Production Build

```bash
npm run build
cd server && NODE_ENV=production npm start
```

## 🗂️ Project Structure

```
liquor-club-system/
├── client/                 # React frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── modules/        # Feature modules (pos, inventory, etc.)
│   │   ├── store/          # Zustand state management
│   │   ├── services/       # API client
│   │   └── utils/          # Helpers, formatters
├── server/                 # Node.js backend (Express)
│   ├── controllers/        # Route controllers
│   ├── routes/            # API route definitions
│   ├── models/            # Mongoose schemas
│   ├── services/          # Business logic
│   ├── middlewares/       # Auth, validation, error handling
│   ├── integrations/      # M-Pesa, SMS, Email services
│   ├── jobs/              # Cron jobs (alerts, backups)
│   ├── utils/             # Helpers, validators
│   └── config/            # Database, env config
├── shared/                # Shared TypeScript types (future)
├── docker-compose.yml     # Docker setup for all services
├── Dockerfile.server      # Backend container
├── Dockerfile.client      # Frontend container
└── .env.example           # Environment variables template
```

## 🔐 Authentication & Roles

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full system access, multi-branch |
| **Admin/Manager** | All operations except user management |
| **Cashier** | POS, customer lookup, receipt printing |
| **Bartender** | View orders, mark as served, stock view only |
| **Auditor** | Read-only access to reports, logs |

## 📱 M-Pesa Integration

- Supports **STK Push** for instant payments
- **Till/Paybill** number reconciliation
- Sandbox environment for testing
- Automatic transaction validation & ledger updates
- Real-time balance tracking

## 📶 Offline-First Design (Kenya-Network Ready)

- Sales cached locally in IndexedDB
- Automatic sync when connection restores
- Conflict resolution for concurrent edits
- Low-stock alerts queue for later delivery

## 🔍 Key Features by Module

### POS
- Lightning-fast interface optimized for touch
- Split bills, tabs, table management
- Happy hour pricing engine
- Multiple payment methods
- Receipt printing (ESC/POS thermal printers)
- Offline mode with local queue

### Inventory
- Real-time stock per bottle/crate/shot
- Unit conversions (bottle → shots, crate → bottles)
- Batch tracking (expiry, supplier, cost)
- Low stock alerts & reorder levels
- Stock transfers between branches
- Waste/spillage/breakage logging
- FIFO/LIFO valuation support

### Customer & Credit
- Customer profiles with phone, preferences, history
- Loyalty points system
- Credit sales with limits ("weka kwa book")
- Aging reports (who owes what)
- Payment reminders via SMS

### Finance
- Expense tracking (rent, utilities, salaries)
- Supplier payments & credit
- Profit & Loss statements
- Cash flow tracking
- VAT & Excise duty calculation (KRA-ready)

### Reporting
- Daily sales summaries
- Product performance (fast/slow movers)
- Profit margins by product
- Staff performance (sales per cashier)
- Peak hours analysis
- Inventory audit reports
- Tax reports (aligned with KRA)

### Compliance
- Excise duty tracking by alcohol type
- Age verification prompts (21+ check)
- Full audit trail for inspections
- Licensing & compliance records
- Data backup & retention policies

## 🐛 Background Jobs (Cron)

- Daily sales summary email at 6 AM
- Low stock alerts every 2 hours
- Credit payment reminders daily at 10 AM
- Data backups (daily at midnight)
- M-Pesa transaction reconciliation
- Automated reorder suggestions

## 🔌 External Integrations

- **M-Pesa Daraja API** – STK Push, B2C, B2B
- **SMS Gateway** – Africa's Talking, Twilio
- **Email Service** – Transactional & bulk
- **Printing** – ESC/POS thermal printers
- **Accounting** – QuickBooks, Xero (future)
- **Delivery** – Sendy, Glovo (future)

## 🛡️ Security Features

- HTTPS/TLS everywhere
- JWT + refresh tokens
- Role-based access control
- Rate limiting on all endpoints
- Input validation (Joi/Zod)
- Audit logging for all actions
- Data encryption at rest (optional)

## 📊 Database Design Highlights

**Collections**:
- `users` – Staff with roles, biometric hashes
- `branches` – Multi-branch support
- `products` – Inventory items with conversions
- `stockMovements` – Full audit trail (sale, purchase, transfer, waste)
- `sales` – All transactions with payment status
- `customers` – Profiles, credit, loyalty
- `creditTransactions` – Credit ledger with aging
- `suppliers` – Vendor database & balances
- `purchases` – Purchase orders & receiving
- `expenses` – Operational costs
- `payments` – All payments (MPesa, cash, card)
- `auditLogs` – Compliance tracking
- `settings` – Branch-specific configuration

## 🎨 Frontend UI/UX

- **Dark mode support** (bar environments)
- **Keyboard shortcuts** for power users
- **Responsive design** – tablets, desktops, mobile POS
- **Print-friendly** receipt templates
- **Dashboard** with KPIs, charts, alerts
- **PWA** – Installable, works offline

## 🚀 Deployment Options

### Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Manual
```bash
# Backend
cd server && npm install && npm start

# Frontend (production)
cd client && npm install && npm run build
# Serve build/ with Nginx
```

### Cloud Providers
- **VPS**: DigitalOcean, AWS EC2, Linode
- **Platform**: Vercel (frontend) + Railway (backend) + Atlas (MongoDB)
- **Container**: AWS ECS, Google Cloud Run

## 🧪 Testing

```bash
cd server
npm test                    # Unit tests (Jest)
npm run test:integration    # API tests
npm run test:e2e            # E2E tests (Puppeteer)
```

## 📈 Roadmap

- [ ] React Native mobile app
- [ ] AI demand forecasting
- [ ] Smart pricing engine
- [ ] Customer behavior analytics
- [ ] E-commerce & online ordering portal
- [ ] Delivery platform integrations
- [ ] Multi-language (English + Swahili)
- [ ] Biometric authentication (fingerprint)

## 🤝 Support

For issues, feature requests, or custom development:
- GitHub Issues: [your-repo-issues]
- Email: support@yourdomain.com
- WhatsApp: +254XXX XXX XXX (Kenya support)

## 📄 License

MIT License – see LICENSE file for details.

---

**Built with ❤️ for Kenyan liquor clubs, bars, and lounges.**
