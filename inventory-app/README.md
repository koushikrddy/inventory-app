# 📦 Smart Inventory Management System

A full-stack, production-quality inventory management application for small retail stores, built with React + FastAPI + MySQL.

## ✨ Features

### Core Features
- **Product Management** - Full CRUD with search, filter, sort, pagination
- **Category Management** - Create, edit, delete categories with product counts
- **Supplier Management** - Manage suppliers with purchase history
- **Inventory Management** - Stock in/out, adjustments, transaction history
- **Sales (POS)** - Point-of-sale interface with cart, payment methods, invoice generation
- **Purchase Management** - Create purchases, auto-update inventory
- **Low Stock Alerts** - Automatic detection and notifications
- **Overstock Detection** - Identify excess inventory

### AI & Analytics
- **AI Demand Prediction** - ML-based demand forecasting using scikit-learn
- **Smart Restock Recommendations** - AI-powered reorder suggestions
- **Fast-Moving Products** - Identify top sellers
- **Slow-Moving Products** - Find underperforming products
- **Smart Insights** - Contextual recommendations on dashboard

### Dashboard & Reports
- **Interactive Dashboard** - Real-time stats with charts (Recharts)
- **Sales Reports** - Daily, weekly, monthly analysis
- **Inventory Reports** - Valuation, status breakdown
- **Purchase Reports** - Supplier analysis
- **CSV Export** - Export reports to CSV

### Security & Auth
- **JWT Authentication** - Secure token-based auth
- **Role-Based Access Control** - Admin & Staff roles
- **Password Hashing** - bcrypt encryption
- **Protected Routes** - Both frontend and backend

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP Client | Axios |
| Backend | Python, FastAPI |
| ORM | SQLAlchemy |
| Validation | Pydantic |
| AI/ML | scikit-learn, pandas, numpy |
| Database | MySQL 8.0 |
| Auth | JWT + bcrypt |
| Container | Docker + Docker Compose |

## 📁 Project Structure

```
inventory-app/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── core/config.py       # Settings & configuration
│   │   ├── database/database.py # DB connection & session
│   │   ├── models/models.py     # SQLAlchemy models
│   │   ├── schemas/schemas.py   # Pydantic schemas
│   │   ├── routers/             # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── products.py
│   │   │   ├── categories.py
│   │   │   ├── suppliers.py
│   │   │   ├── inventory.py
│   │   │   ├── sales.py
│   │   │   ├── purchases.py
│   │   │   ├── dashboard.py
│   │   │   ├── ai.py
│   │   │   ├── notifications.py
│   │   │   ├── reports.py
│   │   │   └── settings.py
│   │   ├── services/            # Business logic
│   │   ├── ai/                  # AI prediction module
│   │   └── utils/auth.py        # JWT utilities
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── context/AuthContext.tsx
│   │   ├── api/axios.ts
│   │   ├── layouts/Layout.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── Categories.tsx
│   │   │   ├── Suppliers.tsx
│   │   │   ├── Inventory.tsx
│   │   │   ├── Sales.tsx
│   │   │   ├── Purchases.tsx
│   │   │   ├── AIInsights.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── Notifications.tsx
│   │   │   └── Settings.tsx
│   │   └── utils/format.ts
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MySQL 8.0+
- npm

### Option 1: Docker (Recommended)

```bash
cd inventory-app
docker-compose up --build
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Local Development

#### 1. MySQL Setup

```sql
CREATE DATABASE smart_inventory;
CREATE USER 'root'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON smart_inventory.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

#### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Configure `.env`:
```env
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/smart_inventory
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:5173
```

Seed the database:
```bash
python -m app.seed_data
```

Start the backend:
```bash
uvicorn app.main:app --reload --port 8000
```

#### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at http://localhost:5173

## 👤 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@store.com | admin123 |
| Staff | staff@store.com | staff123 |

## 📡 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/dashboard | Dashboard data |
| GET | /api/products | List products |
| POST | /api/products | Create product |
| GET | /api/categories | List categories |
| GET | /api/suppliers | List suppliers |
| GET | /api/inventory/transactions | Transaction history |
| POST | /api/sales | Create sale |
| POST | /api/purchases | Create purchase |
| GET | /api/ai/predictions | AI demand predictions |
| GET | /api/ai/recommendations | Restock recommendations |
| GET | /api/reports/sales | Sales report |

## 🧪 Testing

```bash
cd backend
python -m pytest tests/ -v
```

## 📊 Database Schema

- **users** - User accounts with roles
- **categories** - Product categories
- **suppliers** - Supplier information
- **products** - Product catalog with stock levels
- **sales** - Sale transactions
- **sale_items** - Individual sale line items
- **purchases** - Purchase transactions
- **purchase_items** - Individual purchase line items
- **inventory_transactions** - Complete stock movement history
- **notifications** - Alert and notification system
- **settings** - Application configuration

## 🤖 AI Prediction

The AI module uses scikit-learn for demand prediction:
- Analyzes 90-day sales history
- Uses moving average forecasting
- Provides 7-day and 30-day demand predictions
- Calculates expected stockout dates
- Falls back to default values when data is insufficient
- No external API keys required

## 📝 License

MIT License
