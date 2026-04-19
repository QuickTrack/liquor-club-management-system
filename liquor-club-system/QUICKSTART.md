# Liquor Club Management System – Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd liquor-club-system
npm run install:all
```

### Step 2: Configure Environment

```bash
# Backend
cp server/.env.example server/.env

# Edit server/.env with your values
# - MongoDB URI (default: mongodb://localhost:27017/liquor_club_db)
# - JWT secrets (use openssl rand -base64 32)
# - M-Pesa credentials (from developer.safaricom.co.ke)
# - SMS provider keys (Africa's Talking)

# Frontend (optional for dev)
cp client/.env.example client/.env.local
```

### Step 3: Start MongoDB

```bash
# Using Docker (easiest)
docker run -d -p 27017:27017 --name liquor-mongo mongo:7

# Or install locally from mongodb.com
```

### Step 4: Run Development Servers

```bash
# From root, runs both frontend + backend
npm run dev

# Or separately:
cd server && npm run dev   # http://localhost:5000
cd client && npm run dev   # http://localhost:5173
```

### Step 5: Seed Demo Data

```bash
cd server
npm run seed
```

### Step 6: Login

- **URL:** http://localhost:5173
- **Email:** admin@example.com
- **Password:** password123
- **Branch ID:** 001

---

## 🐳 Docker Deployment (Production-Ready)

```bash
# From project root
docker-compose up -d

# All services start:
# - MongoDB on port 27017
# - Backend API on port 5000
# - Frontend on port 80
# - Nginx proxy on port 8080

# Access:
# Main app: http://localhost
# API: http://localhost:5000/api
# MongoDB: localhost:27017
```

**Note:** Before production deployment:
1. Edit `.env` files with real credentials
2. Generate strong JWT secrets
3. Configure SSL certificates
4. Set up domain & DNS
5. Enable monitoring

---

## 📁 Project Structure Summary

```
liquor-club-system/
├── server/           # Express.js backend
│   ├── models/      # 17 MongoDB schemas
│   ├── controllers/ # Business logic + CRUD
│   ├── routes/      # API endpoints
│   ├── middlewares/ # Auth, validation, errors
│   ├── integrations/# M-Pesa, SMS, Email
│   └── jobs/        # Cron automation
│
├── client/           # React + Vite frontend
│   ├── src/
│   │   ├── pages/   # 7 main pages
│   │   ├── store/   # Zustand state
│   │   ├── services/# API client
│   │   └── types/   # TypeScript definitions
│   └── public/      # Static assets
│
├── docker-compose.yml
├── nginx/nginx.conf
└── ARCHITECTURE.md   # Full system documentation
```

---

## 🔑 Default Credentials (Seeded)

| Role | Email | Password | Branch |
|------|-------|----------|--------|
| Super Admin | admin@example.com | password123 | 001 |
| Manager | manager@example.com | password123 | 001 |
| Cashier | cashier@example.com | password123 | 001 |

---

## 📊 Key Features at a Glance

| Module | Status | Key Files |
|--------|--------|-----------|
| **Authentication** | ✅ Complete | server/models/User.js, server/controllers/authController.js |
| **POS** | ✅ Core Complete | client/pages/POS.tsx, server/controllers/saleController.js |
| **Inventory** | ✅ Complete | server/models/Product.js, StockMovement.js, productController.js |
| **Customers & Credit** | ✅ Complete | server/models/Customer.js, CreditTransaction.js, customerController.js |
| **Suppliers & Purchases** | ✅ Complete | server/models/Supplier.js, Purchase.js, purchaseController.js |
| **Expenses & Finance** | ✅ Complete | server/models/Expense.js, expenseController.js |
| **Reporting** | ✅ Skeleton | server/models/Report.js, reportController.js |
| **M-Pesa** | ✅ Skeleton | server/routes/payments.js |
| **SMS** | ⏳ Placeholder | server/integrations/sms.js |
| **Staff Shifts** | ✅ Complete | server/models/Shift.js |
| **Table/Tab Mgmt** | ✅ Complete | server/models/Table.js |
| **Audit Logs** | ✅ Complete | server/models/AuditLog.js |
| **Offline-First** | ⏳ PWA ready | client/src/App.tsx (registerSW), IndexedDB hooks |
| **Multi-Branch** | ✅ Complete | server/models/Branch.js |

✅ = Implemented | ⏳ = Needs implementation

---

## 🎯 Development Roadmap

### Phase 1: Core MVP (This Architecture) ✅
- [x] User authentication (email + PIN)
- [x] POS with cart & checkout
- [x] Inventory CRUD + stock tracking
- [x] Customer management + credit
- [x] Basic reports
- [x] Multi-branch foundation

### Phase 2: Polish & Integrations (Next Steps)
- [ ] Real M-Pesa Daraja integration
- [ ] Africa's Talking SMS (credit reminders, promos)
- [ ] Complete offline-first with IndexedDB sync
- [ ] Advanced reporting with Recharts
- [ ] Receipt printing (ESC/POS)
- [ ] Email notifications (SMTP)
- [ ] Biometric / PIN login on tablets
- [ ] Shift management UI
- [ ] Table reservations

### Phase 3: Advanced Features
- [ ] AI demand forecasting
- [ ] Smart pricing recommendations
- [ ] Advanced analytics dashboard
- [ ] Customer mobile app (React Native)
- [ ] E-commerce portal
- [ ] Integration with QuickBooks/Xero
- [ ] KRA eTIMS compliance (Kenya)
- [ ] Voice ordering (accessibility)
- [ ] Facial recognition login

---

## 🛠️ Tech Stack Decisions (Why These?)

| Category | Choice | Reason |
|----------|--------|--------|
| **Frontend** | React + Vite + TS | Fast DX, great for complex UIs |
| **Styling** | Tailwind CSS | Rapid dev, consistent design system |
| **State** | Zustand | Lightweight, simple, no boilerplate |
| **HTTP** | Axios + React Query | Caching, optimistic updates |
| **Forms** | React Hook Form | Performance, validation |
| **Backend** | Node.js + Express | Mature, vast ecosystem |
| **Database** | MongoDB | Flexible schema, great for this domain |
| **ODM** | Mongoose | Schema validation, hooks |
| **Auth** | JWT | Stateless, scalable |
| **Deployment** | Docker | Portability, cloud-agnostic |
| **Reverse Proxy** | Nginx | Industry standard, SSL, caching |

---

## 🔧 Common Development Tasks

### Add a New API Endpoint

1. **Create controller**: `server/controllers/yourController.js`
2. **Define route**: `server/routes/yourRoute.js`
3. **Register in app.js**: `app.use('/api/your-resource', yourRoute)`
4. **Add validation**: Update `server/middlewares/validation.js` schemas
5. **Frontend service**: `client/src/services/api.ts` (or use axios directly)

### Add a New Page (Frontend)

1. Create component: `client/src/pages/YourPage.tsx`
2. Add route in `client/src/App.tsx`
3. Add navigation item in `DashboardLayout.tsx`
4. Add page to `client/src/pages/index.ts` barrel export

### Add a New Model

1. Define Mongoose schema: `server/models/YourModel.js`
2. Export via `server/models/index.js` (optional)
3. Create controller for CRUD
4. Create routes file
5. Add validation schemas

---

## 📞 Support & Resources

### Documentation
- **Backend API**: See `server/controllers/` and route files
- **Database**: See `server/models/` for schema details
- **Frontend**: `client/src/pages/` for component structure
- **Authentication**: `server/middlewares/auth.js`

### External Services Setup
- **M-Pesa**: [Safaricom Daraja API](https://developer.safaricom.co.ke/)
- **SMS**: [Africa's Talking](https://africastalking.com/) or Twilio
- **Email**: Gmail SMTP or SendGrid

### Debugging

```bash
# Check server logs
cd server && tail -f logs/combined.log

# Check MongoDB
docker exec -it liquor-mongo mongosh -u liquorclub -p liquorclub123 --authenticationDatabase admin

# Verify Docker network
docker network ls | grep liquor

# Frontend dev console errors
# Open browser DevTools → Console
```

---

## 📈 Metrics & KPIs to Track

- **Daily Revenue** – Main KPI
- **Average Transaction Value** – Upsell effectiveness
- **Stock Turnover Rate** – Inventory efficiency
- **Credit Aging** – Cash flow health
- **Customer Lifetime Value** – Loyalty success
- **Items per Transaction** – Sales technique
- **Waste %** – Loss prevention
- **Payment Mix** – M-Pesa vs cash ratio
- **System Uptime** – Reliability

---

## 🚨 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Cannot connect to MongoDB" | Check MongoDB running: `docker ps` / `mongod --version` |
| "JWT secret undefined" | Copy `.env.example` → `.env` and fill JWT_SECRET |
| "401 Unauthorized" | Ensure token sent in Authorization header: "Bearer <token>" |
| "CORS error" | Add frontend URL to `app.js` CORS origins |
| "Port already in use" | Change PORT in `.env` or kill process on 5000/5173 |
| "Offline mode not working" | Check PWA is enabled in `vite.config.ts` |
| "M-Pesa callback failing" | Ensure callback URL is reachable from internet (ngrok for dev) |

---

## 🎓 Learning Resources

- **MongoDB Aggregation**: https://www.mongodb.com/docs/manual/aggregation/
- **M-Pesa API**: https://developer.safaricom.co.ke/
- **React Query**: https://tanstack.com/query/v4/docs/react/overview
- **Zustand**: https://zustand-demo.pmnd.rs/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 📞 Need Help?

1. Check `ARCHITECTURE.md` for detailed system design
2. Review code comments in key files
3. Check console errors in browser/dev tools
4. Examine server logs in `server/logs/`
5. Verify `.env` configuration

---

**Ready to launch?** Run `docker-compose up -d` and you're live within minutes! 🚀
