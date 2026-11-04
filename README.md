# Employee Leave Management System

## 🏢 Project Overview

A complete, full-stack **Employee Leave Management System** built for modern companies. It features a beautiful, responsive UI with separate dashboards for Employees and Administrators, real-time leave tracking, approval workflows, and comprehensive analytics — all backed by a Supabase PostgreSQL database.

**Live Demo:**https://employee-leave-management-system-omega.vercel.app/
**GitHub Repository:** https://github.com/supriya-poojary/Employee-Leave-Management-System

---

## ✨ Features

### Employee Features
- 🔐 Secure JWT-based authentication
- 📊 Personal dashboard with leave statistics
- 📝 Apply for Casual, Sick, Earned, or Unpaid leave
- 📅 Auto-calculated working days (weekends excluded)
- 📂 Optional supporting document upload
- 📜 Full leave history with status tracking
- 💰 Real-time leave balance tracking per type
- 🚫 Duplicate/overlap prevention
- 👤 Profile view and password change

### Admin Features
- 📈 Executive dashboard with live statistics
- ✅ One-click approve/reject with remarks
- 📋 Filter leaves by employee, department, type, status
- 👥 Employee management (add/edit/deactivate)
- 📊 Department-wise and monthly analytics charts
- 🔍 View full application details before deciding

### System Features
- 🔄 Real-time employee-admin workflow synchronization
- 💾 Supabase PostgreSQL cloud database
- 🛡️ Role-based access control (RBAC)
- 📱 Fully responsive (mobile, tablet, desktop)
- 🎨 Premium UI with Framer Motion animations
- 🧮 Atomic database transactions for balance integrity

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js 19 + Vite |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **HTTP Client** | Axios |
| **Backend** | Node.js + Express.js |
| **Database** | Supabase PostgreSQL |
| **Auth** | JWT + bcryptjs |
| **File Upload** | Multer |
| **Date Utils** | date-fns |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (React)                   │
│  Employee Dashboard  │  Admin Dashboard              │
│         ↕                      ↕                    │
│         React Router + Axios + JWT Auth              │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS REST APIs
┌────────────────────▼────────────────────────────────┐
│              Express.js Backend                      │
│  /api/auth  │  /api/leaves  │  /api/employees        │
│  /api/dashboard  │  /api/files                       │
│         ↕                                            │
│    JWT Middleware  │  Business Logic                  │
└────────────────────┬────────────────────────────────┘
                     │ SQL (pg pool + transactions)
┌────────────────────▼────────────────────────────────┐
│           Supabase PostgreSQL (Cloud)                │
│  users  │  leave_applications  │  leave_balances     │
└──────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
Employee Leave Management System/
├── frontend/                    # React + Vite app
│   ├── src/
│   │   ├── api/index.js         # Axios API client
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, Header, DashboardLayout
│   │   │   └── ui/              # LoadingSpinner, Skeleton, Modal, Badge
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Auth state management
│   │   ├── pages/
│   │   │   ├── auth/            # LoginPage
│   │   │   ├── employee/        # Dashboard, Apply, History, Balance, Profile
│   │   │   └── admin/           # Dashboard, Pending, AllLeaves, Employees, Analytics
│   │   ├── App.jsx              # Router setup
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # PostgreSQL pool + Supabase client
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── employeeController.js
│   │   │   ├── leaveController.js
│   │   │   └── dashboardController.js
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── employees.js
│   │   │   ├── leaves.js
│   │   │   └── dashboard.js
│   │   ├── utils/
│   │   │   └── seed.js          # Database seeder
│   │   └── index.js             # Express server entry
│   ├── database/
│   │   └── schema.sql           # Complete DB schema
│   ├── uploads/                 # Uploaded documents
│   ├── .env.example
│   └── package.json
│
├── README.md
├── BRD.md
└── .gitignore
```

---

## 🗄️ Database Schema

### `users` table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated UUID |
| name | VARCHAR | Full name |
| email | VARCHAR (UNIQUE) | Login email |
| password_hash | VARCHAR | bcrypt hashed password |
| role | VARCHAR | `employee` or `admin` |
| employee_id | VARCHAR (UNIQUE) | Company employee ID |
| department | VARCHAR | Department name |
| designation | VARCHAR | Job title |
| joining_date | DATE | Date joined |
| phone | VARCHAR | Contact number |
| is_active | BOOLEAN | Active/deactivated |

### `leave_applications` table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated UUID |
| application_id | VARCHAR (UNIQUE) | LV-2024-0001 format |
| user_id | UUID (FK) | References users |
| leave_type | VARCHAR | `casual/sick/earned/unpaid` |
| start_date | DATE | Leave start date |
| end_date | DATE | Leave end date |
| duration | INTEGER | Working days count |
| reason | TEXT | Leave reason |
| status | VARCHAR | `pending/approved/rejected/cancelled` |
| document_url | TEXT | Optional file upload |
| remarks | TEXT | Admin remarks |
| approved_by | UUID (FK) | Admin user ID |
| approved_at | TIMESTAMPTZ | Approval timestamp |

### `leave_balances` table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated UUID |
| user_id | UUID (FK) | References users |
| leave_type | VARCHAR | `casual/sick/earned/unpaid` |
| year | INTEGER | Calendar year |
| allocated | INTEGER | Total days allocated |
| used | INTEGER | Approved and taken days |
| pending | INTEGER | Days in pending state |
| available | INTEGER | Remaining days |

---

## 📋 Prerequisites

- Node.js v18+ (v22 recommended)
- npm v9+
- Supabase account (free tier)

---

## 🚀 Installation Guide

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/employee-leave-management.git
cd "Employee Leave Management System"
```

### 2. Supabase Database Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the contents of `backend/database/schema.sql`
3. Go to **Settings → Database → Connection string → URI** and copy the connection string
4. Go to **Settings → API** and copy:
   - `Project URL` (SUPABASE_URL)
   - `service_role` key (SUPABASE_SERVICE_ROLE_KEY)

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
npm run seed    # Create admin + sample employees
npm run dev     # Start development server
```

### 4. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev     # Start Vite dev server
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_very_long_random_secret_here
JWT_EXPIRES_IN=7d
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=Admin@123
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register new Employee or Admin account |
| POST | `/api/auth/login` | None | Login with email/password |
| GET | `/api/auth/profile` | JWT | Get current user profile |
| PUT | `/api/auth/change-password` | JWT | Change password |

### Leave Applications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leaves` | JWT | List leaves (filtered) |
| POST | `/api/leaves` | JWT | Submit new application |
| GET | `/api/leaves/:id` | JWT | Get single application |
| PATCH | `/api/leaves/:id/status` | Admin | Approve or reject |
| PATCH | `/api/leaves/:id/cancel` | JWT | Cancel pending application |
| GET | `/api/leaves/balance` | JWT | Get leave balances |

### Employees (Admin only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/employees` | Admin | List all employees |
| POST | `/api/employees` | Admin | Create new employee |
| PUT | `/api/employees/:id` | Admin | Update employee |
| DELETE | `/api/employees/:id` | Admin | Deactivate employee |

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/admin` | Admin | Admin statistics |
| GET | `/api/dashboard/employee` | JWT | Employee statistics |

---

## 🧪 Test Credentials

After running `npm run seed` in the backend:

**Admin:**
- Email: `admin@company.com`
- Password: `Admin@123`

**Employee (sample):**
- Email: `arjun.sharma@company.com`
- Password: `Employee@123`

---

## 🏗️ Production Build

```bash
# Build frontend
cd frontend
npm run build
# Output: frontend/dist/

# Start backend in production
cd backend
NODE_ENV=production npm start
```

---

## 🚀 Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import project in Vercel
3. Set root directory to `frontend`
4. Add environment variable: `VITE_API_URL=https://your-backend.vercel.app/api`
5. Deploy

### Backend (Railway / Render / Fly.io)
1. Create account on [Railway](https://railway.app) or [Render](https://render.com)
2. Connect your GitHub repository
3. Set root directory to `backend`
4. Add all environment variables
5. Set start command: `node src/index.js`
6. Deploy

> ⚠️ **Note:** Standard Vercel serverless functions have limitations with Express.js. Use Railway, Render, or Fly.io for the backend.

---

## 🔄 Development Commands

```bash
# Backend
cd backend
npm run dev      # Start with hot reload (--watch)
npm run seed     # Seed database

# Frontend
cd frontend
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run preview  # Preview production build
```

"# Employee-Leave-Management-System" by Supriya
