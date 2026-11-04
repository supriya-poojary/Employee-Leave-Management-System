# Business Requirements Document (BRD)
## Corporate Employee Leave Management System (ELMS)

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Target Release:** Production v1.0  
**Prepared For:** Enterprise Operations & Human Resources  

---

## 1. Executive Summary & Project Overview

### 1.1 Project Overview
The **Employee Leave Management System (ELMS)** is a high-performance, modern, enterprise-grade cloud application engineered to automate, streamline, and govern employee time-off requests. The platform replaces error-prone manual spreadsheets and disjointed email threads with a centralized cloud database, real-time approval pipelines, role-based dashboards, and audit trails.

### 1.2 Business Objectives
1. **Operational Efficiency:** Reduce administrative turnaround time for leave processing by over 80%.
2. **Data Accuracy & Consistency:** Enforce strict business validation preventing negative balances, unauthorized overlapping leaves, and inaccurate deductions.
3. **Transparency & Trust:** Provide employees and management with real-time visibility into balances, pending approvals, and historical decisions with manager remarks.
4. **Workforce Planning:** Equip team leaders and HR administrators with department-level leave calendars and statistical analytics to prevent understaffing.
5. **Cost Effectiveness:** Leverage cloud-native free-tier architectures (Supabase PostgreSQL + Vercel / Cloud Containerization) with zero software license overhead.

---

## 2. Project Scope

### 2.1 In Scope
- Dual authentication portals (Employee Portal and Administrator Portal).
- End-to-end leave application, withdrawal, and approval workflows.
- Dynamic balance calculation per leave category (Casual, Sick, Earned, Unpaid).
- Business day computation excluding calendar weekends.
- Admin dashboard featuring analytics, KPI metrics, and department breakdowns.
- Employee management module (adding new staff, profile modification, account deactivation).
- Full audit logging including timestamps, administrator remarks, and status transitions.
- Responsive design tailored for mobile phones, tablets, and high-resolution desktops.

### 2.2 Out of Scope (Future Phases)
- Multi-tier manager approval chains (Level 1 Supervisor -> Level 2 Department Head -> HR).
- Biometric hardware integration.
- Automated payroll deduction export (payroll integration planned for v2.0).

---

## 3. Stakeholders & User Roles

| Role | Primary Responsibilities | Access Scope |
|------|--------------------------|--------------|
| **Employee** | Applies for leave, monitors personal quotas, views application history, updates password. | Personal dashboard, personal leave records, personal profile. Cannot view peers' data or approve leaves. |
| **Administrator (HR / Manager)** | Reviews pending leave requests, approves/rejects with mandatory remarks, provisions employee accounts, tracks workforce attendance. | System-wide dashboard, all employee records, department analytics, approval actions. |
| **System Operator / Developer** | Configures database schema, runs seed scripts, manages cloud deployment pipelines and environment variables. | Infrastructure, database connection strings, serverless backend instances. |

---

## 4. Business Rules & Leave Policies

### 4.1 Leave Quota Allocations (Annual Default)
- **Casual Leave (CL):** 12 days per calendar year. Intended for personal matters, emergency family events, and short breaks.
- **Sick Leave (SL):** 12 days per calendar year. Intended for medical sickness or convalescence. Medical certificate upload permitted.
- **Earned / Privilege Leave (EL):** 15 days per calendar year. Intended for planned vacations and longer personal respite.
- **Unpaid Leave (LWP):** 0 allocated days. Does not deduct from paid balances; tracked separately for payroll transparency.

### 4.2 Leave Calculation Rules
1. **Working Days Exemption:** Working days are calculated strictly from Monday through Friday. Saturdays and Sundays within a requested date interval are automatically excluded from the computed duration.
2. **Balance Validation:**
   - For paid leaves (`casual`, `sick`, `earned`), applications are rejected at the server level if `duration > available_balance`.
   - Applications for past dates are blocked.
   - Applications where `start_date > end_date` are blocked.
3. **Overlap Prohibition:** An employee cannot hold two active applications (`pending` or `approved`) covering overlapping calendar dates.
4. **Atomic Deduction Lifecycle:**
   - **Submission:** Status set to `pending`. Allocated balance remains unchanged; `pending` counter increases by duration; `available` balance decreases by duration to prevent race conditions.
   - **Approval:** Status set to `approved`. `pending` counter decreases by duration; `used` counter increases by duration.
   - **Rejection:** Status set to `rejected`. `pending` counter decreases by duration; `available` balance is restored.
   - **Cancellation:** If cancelled by the employee prior to admin action, status set to `cancelled` and reserved balance is restored immediately.

---

## 5. Functional Requirements Specification

### 5.1 Module 1: Authentication & Authorization (AUTH)
- **AUTH-01:** System shall authenticate users via email and bcrypt-hashed password.
- **AUTH-02:** System shall generate an encrypted JSON Web Token (JWT) with standard 7-day expiration.
- **AUTH-03:** Client application shall persist session credentials securely and intercept API responses; any HTTP 401 triggers clean logout and redirect to `/login`.
- **AUTH-04:** Protected routes shall guard Employee pages from unauthenticated access and Admin pages from non-admin accounts.
- **AUTH-05:** Users shall have the ability to change their passwords with current password verification and an 8-character minimum constraint.

### 5.2 Module 2: Employee Portal (EMP)
- **EMP-01:** Dashboard presents real-time KPI cards: Total Allocated, Remaining Available, Pending Requests, Approved Leaves, and Rejected Leaves.
- **EMP-02:** Leave submission form contains dropdown selector, start date picker, end date picker, real-time duration calculator, reason textarea, and optional file attachment uploader (PDF/JPG/PNG up to 5MB).
- **EMP-03:** Leave history view features paginated tables, search input, status filter (`all`, `pending`, `approved`, `rejected`, `cancelled`), and type filter.
- **EMP-04:** Pending applications can be self-cancelled by the employee prior to manager review.
- **EMP-05:** Profile screen displays Employee ID, Designation, Department, Email, Phone, and Joining Date.

### 5.3 Module 3: Administrator Portal (ADM)
- **ADM-01:** Executive dashboard renders total workforce headcounts, applications under review, employees currently absent/on leave today, and approval ratios.
- **ADM-02:** Graphical analytics display monthly application volume and department-wise distribution via responsive Recharts components.
- **ADM-03:** Pending Review Queue provides instant one-click approval or rejection modal dialogues with mandatory remark entry for rejections.
- **ADM-04:** Global Leave Records view allows multidimensional filtering across status, leave category, and department.
- **ADM-05:** Employee Management module allows administrators to provision new team members (auto-generating initial leave balance records) and deactivate ex-employees.

---

## 6. Non-Functional Requirements (NFR)

### 6.1 Performance & Responsiveness
- **Page Load Time:** Initial Largest Contentful Paint (LCP) under 1.8 seconds on standard broadband.
- **API Latency:** 95th percentile database queries resolve under 150ms.
- **Responsive Layout:** 100% fluid layouts compatible with Viewport widths from 360px (mobile) to 2560px (ultra-wide desktop).

### 6.2 Security & Data Integrity
- **Password Storage:** bcrypt cryptographic hash with 12 salt rounds.
- **SQL Injection Prevention:** 100% parameterized queries via PostgreSQL driver (`$1, $2, ...`).
- **Database Transactions:** Multi-statement balance adjustments wrapped in strict `BEGIN ... COMMIT / ROLLBACK` transaction blocks with `SELECT ... FOR UPDATE` row locks.
- **Transport Security:** Enforced HTTPS on API endpoints and client delivery.

### 6.3 Usability & Design Reference
- Designed in accordance with corporate enterprise aesthetics inspired by modern SaaS portals (clean cards, subtle gradients `#667eea` to `#764ba2`, micro-interactions via Framer Motion, and status badge color coding).

---

## 7. System Architecture & Component Design

```
+------------------------------------------------------------------------+
|                          CLIENT APPLICATION                            |
|             React 19 + Vite + Tailwind CSS + Framer Motion             |
|                                                                        |
|  [ AuthContext ]  <--->  [ ProtectedRoute ]  <--->  [ Axios Client ]  |
|          |                         |                        |          |
|  +---------------+       +------------------+       +---------------+  |
|  | Employee View |       |  Admin View      |       | Shared UI     |  |
|  | - Dashboard   |       |  - KPI Overview  |       | - Badges      |  |
|  | - Apply Form  |       |  - Approvals     |       | - Skeletons   |  |
|  | - History     |       |  - Employee CRUD |       | - Modals      |  |
|  | - Profile     |       |  - Analytics     |       | - Spinners    |  |
|  +---------------+       +------------------+       +---------------+  |
+------------------------------------|-----------------------------------+
                                     | HTTPS / JSON
+------------------------------------v-----------------------------------+
|                           EXPRESS.JS BACKEND                           |
|                                                                        |
|  [ CORS & JSON Parser ] -> [ Auth JWT Middleware ] -> [ Controllers ]   |
|                                                                        |
|  Controllers:                                                          |
|  - authController.js        (Login, Profile, Password)                 |
|  - leaveController.js       (Application, Approval, Balance Math)      |
|  - employeeController.js    (CRUD, Department Aggregations)            |
|  - dashboardController.js   (KPI & Chart Metric Computations)          |
+------------------------------------|-----------------------------------+
                                     | PostgreSQL Connection Pool (pg)
+------------------------------------v-----------------------------------+
|                       SUPABASE CLOUD DATABASE                          |
|                                                                        |
|  - Table: users               (UUID PK, Auth, Role, Department)        |
|  - Table: leave_applications  (Dates, Duration, Status, Reason)        |
|  - Table: leave_balances      (Allocated, Used, Pending, Available)    |
|  - Triggers & Functions       (Auto-updating updated_at timestamps)    |
+------------------------------------------------------------------------+
```

---

## 8. Database Schema Overview & Entity Relationships

### 8.1 Entity Relationship Diagram (ERD)

```
       +---------------------------------------------+
       |                    users                    |
       +---------------------------------------------+
       | id (UUID, PK)                               |
       | email (VARCHAR, UNIQUE)                     |
       | password_hash (VARCHAR)                     |
       | role ('employee' | 'admin')                 |
       | employee_id (VARCHAR, UNIQUE)               |
       | department (VARCHAR)                        |
       | designation (VARCHAR)                       |
       | is_active (BOOLEAN)                         |
       | created_at, updated_at, last_login          |
       +---------------------------------------------+
              |                               |
       1:N    |                               | 1:N
              v                               v
+-------------------------------+   +-------------------------------+
|      leave_applications       |   |        leave_balances         |
+-------------------------------+   +-------------------------------+
| id (UUID, PK)                 |   | id (UUID, PK)                 |
| application_id (VARCHAR, UNQ) |   | user_id (UUID, FK -> users)   |
| user_id (UUID, FK -> users)   |   | leave_type (casual|sick|etc)  |
| leave_type (VARCHAR)          |   | year (INTEGER)                |
| start_date, end_date (DATE)   |   | allocated (INTEGER)           |
| duration (INTEGER)            |   | used (INTEGER)                |
| reason (TEXT)                 |   | pending (INTEGER)             |
| status (pending|approved|...) |   | available (INTEGER)           |
| approved_by (UUID, FK->users) |   +-------------------------------+
| approved_at (TIMESTAMPTZ)     |
| remarks (TEXT)                |
+-------------------------------+
```

---

## 9. Comprehensive Deployment & Operations Guide

### 9.1 Infrastructure Services
- **Frontend Hosting:** Vercel (Edge Network)
- **Backend Hosting:** Vercel Serverless Functions / Railway / Render
- **Database:** Supabase Managed PostgreSQL (AWS Free Tier Region)

### 9.2 Environment Variables Reference
Ensure the following keys are populated in your target deployment environments:

#### Backend (.env / Hosting Provider Secrets)
| Variable | Sample Value | Purpose |
|----------|--------------|---------|
| `PORT` | `5000` | Local port binding |
| `NODE_ENV` | `production` | Production optimizations |
| `FRONTEND_URL` | `https://leave-portal.vercel.app` | Allowed CORS origins |
| `JWT_SECRET` | `a_64_char_secure_random_hex_string` | Token signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
| `DATABASE_URL` | `postgresql://postgres:[PW]@db.[REF].supabase.co:5432/postgres` | PostgreSQL connection pool |
| `SUPABASE_URL` | `https://[REF].supabase.co` | Supabase API endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Supabase Administrative key |
| `ADMIN_EMAIL` | `admin@company.com` | Default admin seed identifier |
| `ADMIN_PASSWORD` | `Admin@123` | Default admin seed secret |

#### Frontend (.env / Vercel Environment Variables)
| Variable | Sample Value | Purpose |
|----------|--------------|---------|
| `VITE_API_URL` | `https://leave-api.vercel.app/api` | Base API target URL |

### 9.3 Step-by-Step Deployment Instructions

#### Step 1: Database Initialization on Supabase
1. Create a free account at [Supabase](https://supabase.com).
2. Create a new project (e.g., `company-elms`).
3. Navigate to **SQL Editor** in the Supabase Dashboard.
4. Copy the entire contents of `backend/database/schema.sql` and click **Run**.
5. Navigate to **Project Settings > Database > Connection String > URI** and copy the URI.
6. Replace `[YOUR-PASSWORD]` with the database password set during project creation.

#### Step 2: Database Seeding
To populate the database with the initial Administrator account and departmental employees:
```bash
cd backend
# Create your .env file with DATABASE_URL configured
npm install
npm run seed
```

#### Step 3: Backend Deployment (Vercel Serverless or Container Platform)
**Option A: Vercel Serverless Function**
1. Ensure `backend/vercel.json` exists (configured with `@vercel/node`).
2. Run `vercel deploy` or connect your GitHub repository and designate `backend` as the Root Directory.
3. In Vercel Project Settings, add all backend environment variables listed in Section 9.2.

**Option B: Railway or Render (Alternative zero-config Node runtime)**
1. Connect repository to [Railway](https://railway.app) or [Render](https://render.com).
2. Set Root Directory to `backend`.
3. Set Build Command to `npm install` and Start Command to `npm start`.
4. Inject environment variables.

#### Step 4: Frontend Deployment (Vercel)
1. In Vercel, click **Add New Project** and select the repository.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Add Environment Variable:
   - `VITE_API_URL`: Your deployed backend URL with `/api` suffix.
7. Click **Deploy**.

### 9.4 How Another Developer Can Run Locally
1. Clone the repository:
   ```bash
   git clone <REPO_URL>
   cd "Employee Leave Management System"
   ```
2. Start the Backend:
   ```bash
   cd backend
   cp .env.example .env
   # Add your Supabase DATABASE_URL
   npm install
   npm run seed
   npm run dev
   ```
3. Start the Frontend (in a second terminal):
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```
4. Access the web portal at `http://localhost:5173`.
5. Use sample credentials:
   - **Admin:** `admin@company.com` / `Admin@123`
   - **Employee:** `arjun.sharma@company.com` / `Employee@123`

---

## 10. Acceptance Criteria & Verification Matrix

| Ref | Requirement | Verification Method | Result |
|-----|-------------|---------------------|--------|
| **AC-01** | Employee login with valid credentials | Submitting employee credentials redirects to `/employee` | Pass |
| **AC-02** | Admin login with valid credentials | Submitting admin credentials redirects to `/admin` | Pass |
| **AC-03** | Route protection by role | Navigating to `/admin` with an employee token redirects to `/employee` | Pass |
| **AC-04** | Leave duration calculation | Mon-Fri range returns 5 days; Fri-Mon range returns 2 days | Pass |
| **AC-05** | Overlap blocking | Submitting leave for already booked dates returns HTTP 409 Conflict | Pass |
| **AC-06** | Insufficient balance blocking | Submitting duration exceeding balance returns HTTP 400 Bad Request | Pass |
| **AC-07** | Admin approval workflow | Approving request updates status to `approved`, reduces `pending`, increases `used` | Pass |
| **AC-08** | Admin rejection workflow | Rejecting request updates status to `rejected`, restores `available` balance | Pass |
| **AC-09** | Production compilation | `npm run build` in `frontend` completes with 0 errors | Pass |

---
*End of Business Requirements Document*

