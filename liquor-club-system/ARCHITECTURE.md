**Liquor Club Management System – Complete Architecture**

A full-stack liquor club/bar management system built for the Kenyan market with M-Pesa integration, offline-first POS, inventory control, compliance features, and modular design.

---

## 📁 Project Structure

```
liquor-club-system/
├── server/                    # Node.js + Express Backend
│   ├── models/               # MongoDB schemas (Mongoose)
│   │   ├── User.js          # Staff management, biometric/PIN auth
│   │   ├── Branch.js        # Multi-branch support
│   │   ├── Product.js       # Inventory items with conversions
│   │   ├── StockMovement.js # Audit trail for all stock changes
│   │   ├── Sale.js          # POS transactions
│   │   ├── Customer.js      # Loyalty + credit tracking
│   │   ├── CreditTransaction.js # Credit ledger
│   │   ├── Supplier.js      # Vendor management
│   │   ├── Purchase.js      # Purchase orders & receiving
│   │   ├── Expense.js       # Operational tracking
│   │   ├── AuditLog.js      # Compliance logs
│   │   ├── Shift.js         # Staff shift management
│   │   ├── Table.js         # Tab & table management
│   │   ├── DiscountPromotion.js # Happy hour & promos
│   │   ├── HappyHour.js     # Time-based pricing rules
│   │   ├── Report.js        # Saved reports
│   │   └── SystemSettings.js# Global/branch config
│   ├── controllers/          # Business logic
│   │   ├── authController.js
│   │   ├── saleController.js
│   │   ├── productController.js
│   │   ├── customerController.js
│   │   └── ...
│   ├── routes/              # API endpoints
│   │   ├── auth.js
│   │   ├── sales.js
│   │   ├── products.js
│   │   ├── customers.js
│   │   ├── credit.js
│   │   ├── inventory.js     # Stock endpoints
│   │   ├── purchases.js
│   │   ├── expenses.js
│   │   ├── reports.js
│   │   ├── audit.js
│   │   ├── settings.js
│   │   └── tables.js
│   ├── middlewares/         # Express middleware
│   │   ├── auth.js         # JWT + RBAC
│   │   ├── errorHandler.js
│   │   └── validation.js   # Joi schemas
│   ├── integrations/        # External services
│   │   ├── mpesa.js        # Daraja API
│   │   ├── sms.js          # Africa's Talking
│   │   └── email.js        # SMTP
│   ├── jobs/               # Cron jobs
│   │   ├── lowStockAlerts.js
│   │   ├── dailySummary.js
│   │   ├── creditReminders.js
│   │   └── backup.js
│   ├── utils/              # Helpers
│   │   ├── logger.js
│   │   ├── validators.js
│   │   └── formatters.js   # KES currency, phone formats
│   ├── config/             # Configuration
│   │   ├── database.js
│   │   └── constants.js    # Enums & Kenya-specific
│   └── app.js              # Express app + middlewares
│
├── client/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/         # Reusable components (Button, Input, Card, Modal)
│   │   │   ├── layout/    # DashboardLayout, AuthLayout
│   │   │   ├── forms/     # Form fields, validations
│   │   │   ├── pos/       # POS-specific components
│   │   │   ├── inventory/ # Inventory UI
│   │   │   └── reports/   # Charts, tables
│   │   ├── modules/       # Feature modules
│   │   │   ├── auth/      # Login, PIN auth
│   │   │   ├── pos/       # POS cart, checkout
│   │   │   ├── inventory/ # Product CRUD, stock tracking
│   │   │   ├── customers/ # Customer management, credit
│   │   │   ├── reports/   # Report builder, charts
│   │   │   └── settings/  # Branch config, M-Pesa
│   │   ├── pages/         # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── POS.tsx
│   │   │   ├── Inventory.tsx
│   │   │   ├── Customers.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── Settings.tsx
│   │   ├── store/         # Zustand state
│   │   │   ├── authStore.ts
│   │   │   ├── posStore.ts
│   │   │   ├── inventoryStore.ts
│   │   │   └── ...
│   │   ├── services/      # API client
│   │   │   └── api.ts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Formatters, validators, currency
│   │   └── types/         # TypeScript interfaces
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── docker-compose.yml       # Full stack orchestration
├── Dockerfile.server        # Backend container
├── Dockerfile.client        # Frontend container
├── nginx/                   # Reverse proxy config
├── scripts/                 # DB migration, seeders
├── .env.example             # Env template
├── README.md               # Project documentation
└── ARCHITECTURE.md         # This detailed architecture doc
```

---

## 🎯 Key Features Implemented

### 1. **Point of Sale (POS)**
- Touch-friendly interface optimized for tablets
- Product grid with search & categories
- Real-time cart with tax calculations
- Split payment (Cash + M-Pesa + Card + Credit)
- Offline-first: local storage + sync queue
- Receipt printing (thermal printers)
- Tab & table management

### 2. **Inventory & Stock Control**
- Real-time tracking per bottle/crate/shot
- Unit conversions: 1 bottle = 30 shots (configurable)
- Batch tracking with expiry dates
- Low stock alerts & reorder suggestions
- Stock transfers between branches
- FIFO/LIFO valuation
- Waste/spillage/breakage logging

### 3. **Customer & Membership**
- Customer profiles with preferences
- Loyalty points: 10 points per KES 1 spent (configurable)
- Credit sales ("weka kwa book") with limits
- Credit aging & payment reminders (SMS)
- VIP tiers (Regular, Silver, Gold, Platinum)
- Birthday rewards, anniversary offers

### 4. **Staff Management**
- Role-based access (Super Admin → Cashier)
- Shift management with cash count
- Commission tracking per sale/product
- Biometric/PIN login
- Full audit trail of actions

### 5. **Compliance & Legal**
- Excise duty tracking by alcohol type
- Age verification prompts (18+)
- Audit logs for KRA inspections
- Tax reports (VAT, excise)
- License expiry tracking

### 6. **Multi-Branch Support**
- Centralized dashboard
- Branch-specific inventories
- Inter-branch stock transfers
- Consolidated financial reports
- Branch-level user access

### 7. **M-Pesa Integration**
- STK Push for instant payments
- Till & Paybill number reconciliation
- Automatic transaction validation
- Transaction status checking
- Sandbox mode for testing

### 8. **Reporting & Analytics**
- Daily sales summaries
- Product performance (fast/slow movers)
- Profit margins per item
- Staff performance (tips, sales)
- Credit aging reports
- Tax compliance reports

### 9. **Alerts & Automation**
- Low stock notifications
- Daily sales summaries (email/SMS)
- Credit payment reminders
- Expiry alerts
- Automated reorder suggestions

### 10. **Offline-First Architecture**
- IndexedDB for local storage
- Background sync when online
- Conflict resolution
- Works without network (Kenya ready)

---

## 🔧 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript + Vite | Fast, modern UI |
| **UI Lib** | Tailwind CSS + Headless UI | Rapid styling |
| **State** | Zustand | Lightweight global state |
| **Data Fetch** | React Query | Caching, sync |
| **Forms** | React Hook Form | Validation |
| **Charts** | Recharts | Analytics visualization |
| **PWA** | Vite PWA Plugin | Offline support |
| **Backend** | Node.js + Express | REST API |
| **Database** | MongoDB + Mongoose | Document storage |
| **Auth** | JWT + Bcrypt | Secure auth |
| **Validation** | Joi | Input validation |
| **Payments** | M-Pesa Daraja API | Mobile money |
| **SMS** | Africa's Talking | Notifications |
| **Email** | Nodemailer + SMTP | Communications |
| **DevOps** | Docker + Docker Compose | Containerization |
| **CI/CD** | GitHub Actions (template) | Automation |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+ (or Docker)
- Bun (recommended) – `npm i -g bun`

### 1. Clone & Install

```bash
git clone <your-repo>
cd liquor-club-system
npm run install:all
```

### 2. Environment Setup

```bash
# Backend
cp server/.env.example server/.env
# Edit server/.env with:
# - MongoDB URI
# - JWT secrets
# - M-Pesa credentials (from developer.safaricom.co.ke)
# - SMS provider keys

# Frontend
cp client/.env.example client/.env.local
# Edit VITE_API_URL if needed
```

### 3. Database Seeding (Optional)

```bash
cd server && npm run seed
# Seeds: admin user, sample branch, demo products
```

### 4. Run Development

```bash
# From root directory
npm run dev

# Or separately:
cd server && npm run dev   # Backend: http://localhost:5000
cd client && npm run dev   # Frontend: http://localhost:5173
```

### 5. Access Application

- Dashboard: http://localhost:5173
- Default admin: `admin@example.com` / `password123`
- Branch ID: `001` (or your seeded branch)

---

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Services:
- MongoDB on port 27017
- Backend API on port 5000
- Frontend (Nginx) on port 80
- Reverse proxy on port 8080

### Build & Push to Registry

```bash
# Build images
docker build -t yourorg/liquor-club-server ./server
docker build -t yourorg/liquor-club-client ./client

# Push
docker push yourorg/liquor-club-server
docker push yourorg/liquor-club-client

# Deploy on any platform:
# - AWS ECS / EKS
# - Google Cloud Run
# - Azure Container Instances
# - DigitalOcean App Platform
# - Railway / Render
```

### Kubernetes (Future)

```yaml
# k8s manifests available in /k8s/ (future)
kubectl apply -f k8s/
```

---

## 🏗️ Database Schema Overview

### Core Collections

**users** – Staff accounts, roles, biometric data
**branches** – Multi-branch setup
**products** – Inventory items with conversion rates
**stockMovements** – Full audit trail (sale/purchase/transfer/waste)
**sales** – All transactions
**saleItems** – Embedded in sales
**customers** – Profiles, loyalty, credit
**creditTransactions** – Credit aging ledger
**suppliers** – Vendor database
**purchases** – Purchase orders & receiving
**expenses** – Operational costs
**auditLogs** – Compliance tracking (7-year retention)
**shifts** – Cashier shift management
**tables** – Restaurant/bar tables
**discountPromotions** – Happy hour & promos
**reports** – Cached reports

---

## 🔐 Security Architecture

- **HTTPS/TLS** enforced in production
- **JWT access tokens** (7d expiry) + **refresh tokens** (30d)
- **Role-based access control** (RBAC)
- **Rate limiting** – 100 req/15min per IP
- **Input validation** – Joi on all endpoints
- **Audit logging** – All critical actions
- **Password hashing** – bcrypt (12 rounds)
- **SQL/NoSQL injection** prevention
- **CORS** configured
- **Helmet** security headers

---

## 🇰🇪 Kenya-Specific Adaptations

| Feature | Implementation |
|---------|----------------|
| **Phone numbers** | Regex: `^\+?254[0-9]{9}$` or `^07[0-9]{8}$` |
| **Currency** | KES with proper 2 decimal formatting |
| **Tax** | VAT 16%, Excise varies by product type |
| **Credit culture** | "Weka kwa book" – flexible credit limits |
| **M-Pesa** | STK Push, Till/Paybill, B2C, B2B |
| **SMS** | Africa's Talking integration |
| **Swahili** | i18n ready (`preferredLanguage: 'sw'`) |
| **Offline** | IndexedDB + background sync (network instability) |
| **IDs** | National ID (2.8M ID cards) |

---

## 📱 Mobile & Offline

- **PWA** – Installable, works offline
- **Local storage** – IndexedDB for cart & sync queue
- **Background sync** – Queued mutations sync when online
- **Touch-optimized** POS grid for tablets
- **Push notifications** (future) for low stock alerts

---

## 🧠 Advanced Features (Optional)

1. **AI Demand Forecasting** – Predict stock needs with ML
2. **Dynamic Pricing** – Adjust prices based on demand/day
3. **Fraud Detection** – Anomaly detection in sales
4. **Self-Service Kiosk** – Customer-facing ordering
5. **Kiosk Mode** – Lockdown POS for public use
6. **Biometric Authentication** – Fingerprint/facial login
7. **E-commerce Portal** – Online ordering + delivery
8. **Mobile App (React Native)** – iOS/Android

---

## 🧪 Testing Strategy

```bash
# Unit tests (Jest)
cd server && npm test

# Integration tests (Supertest)
npm run test:integration

# E2E tests (Puppeteer)
npm run test:e2e

# Frontend tests (Vitest)
cd client && npm run test

# Linting
npm run lint

# Type checking
npm run typecheck
```

---

## 📊 Monitoring & Observability

- **Application logs** – Winston (JSON) → ELK/Papertrail
- **Error tracking** – Sentry (recommended)
- **Uptime monitoring** – UptimeRobot / Pingdom
- **Database monitoring** – MongoDB Atlas metrics
- **Performance** – New Relic / Datadog
- **Audit logs** – Immutable, 7-year retention

---

## 📦 Seeding & Demo Data

```bash
cd server
npm run seed
```

Creates:
- 1 Super Admin user (`admin@example.com` / `password123`)
- 1 Branch (`Main Branch`)
- 20 Sample Products (Beer, Wine, Spirits)
- 5 Customers (with credit)
- 3 Staff members

---

## 🛠️ Development Workflow

1. **Create branch** – `git checkout -b feature/pos-offline`
2. **Develop** – follow existing patterns
3. **Write tests** – unit + integration
4. **Lint & typecheck** – `npm run lint && npm run typecheck`
5. **Commit** – clear message: `feat(pos): add offline sync`
6. **Push & PR** – trigger CI
7. **Review & merge** → auto-deploy to staging

---

## 📁 Configuration Management

| File | Purpose |
|------|---------|
| `server/.env` | Backend secrets (never commit) |
| `client/.env.local` | Frontend env (VITE_*) |
| `docker-compose.yml` | Service orchestration |
| `nginx/nginx.conf` | Reverse proxy + SSL |
| `crontab` | Scheduled jobs |
| `elasticbeanstalk/` | AWS EB config (optional) |

---

## 🔄 API Design (REST)

### Base URL
```
http://localhost:5000/api
```

### Authentication
- POST `/auth/login` – Email/password
- POST `/auth/pin-login` – Quick staff login
- POST `/auth/refresh` – Token refresh
- GET  `/auth/me` – Current user

### Endpoint Pattern
```
GET    /resource              – List (with filters)
GET    /resource/:id          – Detail
POST   /resource              – Create
PUT    /resource/:id          – Update
DELETE /resource/:id          – Delete (soft)

Specialized:
POST   /sales/:id/void
POST   /sales/:id/refund
POST   /stock/movements
GET    /reports/sales-summary
POST   /payments/mpesa/stk-push
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "pagination": { "page": 1, "total": 100, ... }
}
```

### Error Format
```json
{
  "error": "Validation error",
  "code": "VALIDATION_ERROR",
  "details": { "field": "error message" }
}
```

---

## ✅ Production Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT secrets (64+ chars)
- [ ] Configure MongoDB with replica set
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Configure M-Pesa production credentials
- [ ] Set up SMS provider (Africa's Talking)
- [ ] Configure email SMTP
- [ ] Set up domain & DNS
- [ ] Configure CORS for production domain
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Schedule backups (daily)
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure cron jobs for alerts
- [ ] Enable PWA service worker
- [ ] Test offline mode
- [ ] Load test critical endpoints
- [ ] Security audit (OWASP checklist)
- [ ] Legal: Terms of use, privacy policy
- [ ] KRA compliance validation
- [ ] Staff training documentation

---

## 📚 API Documentation

**Swagger/OpenAPI** – coming soon  
**Postman Collection** – `docs/postman.json`

---

## 🎨 UI/UX Design

- **Dark mode first** – Bar environments are dimly lit
- **Touch-optimized** – Large tap targets
- **Keyboard shortcuts** – Power user support (F2 for new sale)
- **Responsive** – Desktop, tablet, mobile POS
- **Print-friendly** – Receipts, reports
- **Accessibility** – ARIA labels, keyboard nav

---

## 🧩 Extensibility

Plugins via:
- **Webhooks** – External system notifications
- **Custom Reports** – MongoDB aggregation editor
- **Third-party integrations** – Accounting software (QuickBooks)
- **API-first** – Any system can integrate

---

## 📈 Scaling Roadmap

| Phase | Users | Branches | QPS | Notes |
|-------|-------|----------|-----|-------|
| 1 | 1-10 | 1 | 10 | Single branch, basic POS |
| 2 | 10-50 | 1-3 | 50 | Multi-branch, M-Pesa |
| 3 | 50-200 | 5-10 | 200 | Redis cache, load balancer |
| 4 | 200+ | 20+ | 500+ | Microservices, sharding |

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md].

---

## 📄 License

MIT License – See [LICENSE](LICENSE) for details.

---

**Built for Kenya 🇰🇪 | Optimized for bars, lounges & liquor clubs | Offline-first | M-Pesa native**
