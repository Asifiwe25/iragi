# IRAGI — Complete Setup Guide
## Refugee Management System · Full Stack (React + Node.js + PostgreSQL)

---

## ── WHAT YOU WILL BUILD ─────────────────────────────────────────

A full-stack web application with:
- **Frontend**: React + Vite + Tailwind CSS (http://localhost:3000)
- **Backend**:  Node.js + Express REST API (http://localhost:5000)
- **Database**: PostgreSQL (managed with pgAdmin)
- **Auth**:     JWT with role-based access control

---

## ── PREREQUISITES ───────────────────────────────────────────────

Install these before starting:

| Tool            | Download                                      | Version    |
|-----------------|-----------------------------------------------|------------|
| Node.js         | https://nodejs.org                            | 18+        |
| PostgreSQL       | https://www.postgresql.org/download/          | 14+        |
| pgAdmin 4       | https://www.pgadmin.org/download/             | Any        |
| VSCode          | https://code.visualstudio.com/                | Any        |
| Git (optional)  | https://git-scm.com/                          | Any        |

---

## ── STEP 1 — OPEN THE PROJECT IN VSCODE ────────────────────────

1. Open VSCode
2. Go to **File → Open Folder**
3. Select the `iragi/` folder (the root of this project)
4. You should see two folders: `backend/` and `frontend/`

Recommended VSCode Extensions (install from Extensions panel):
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **Prettier - Code formatter**
- **REST Client** (to test API routes)
- **PostgreSQL** (by Chris Kolkman)

---

## ── STEP 2 — CREATE THE DATABASE IN PGADMIN ────────────────────

1. Open **pgAdmin 4**
2. In the left panel, expand **Servers → PostgreSQL**
3. Right-click on **Databases** → **Create → Database**
4. Set:
   - **Database name**: `iragi`
   - **Owner**: `postgres` (or your PostgreSQL username)
5. Click **Save**

✅ You should now see `iragi` listed under Databases.

---

## ── STEP 3 — CONFIGURE BACKEND ENVIRONMENT ─────────────────────

1. In VSCode, open the `backend/` folder
2. Find the file `.env.example`
3. Copy it and rename the copy to `.env`:

   ```
   backend/.env.example  →  backend/.env
   ```

4. Open `backend/.env` and fill in your values:

   ```env
   PORT=5000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=iragi
   DB_USER=postgres
   DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE

   JWT_SECRET=iragi_super_secret_key_2025_change_me
   JWT_EXPIRES_IN=7d

   FRONTEND_URL=http://localhost:3000

   # Cloudinary (optional for photo uploads — get free account at cloudinary.com)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

   ⚠️ Replace `YOUR_POSTGRES_PASSWORD_HERE` with your actual PostgreSQL password.

---

## ── STEP 4 — INSTALL BACKEND DEPENDENCIES ──────────────────────

Open a terminal in VSCode (**Terminal → New Terminal**), then:

```bash
# Navigate to backend folder
cd backend

# Install all packages
npm install
```

Wait for it to complete. You should see a `node_modules/` folder appear.

---

## ── STEP 5 — RUN DATABASE MIGRATIONS ──────────────────────────

Still in the `backend/` directory in your terminal:

```bash
# Create all database tables
node src/config/migrate.js
```

Expected output:
```
✅ PostgreSQL connected
🚀 Running IRAGI database migrations...
✅ All tables created successfully!

Tables created:
  → audit_logs
  → camps
  → case_notes
  → cases
  → distributions
  → family_groups
  → inventory
  → refugees
  → users
```

You can verify in **pgAdmin**: expand `iragi → Schemas → public → Tables`
You should see all 9 tables listed.

---

## ── STEP 6 — SEED DEMO DATA ────────────────────────────────────

```bash
node src/config/seed.js
```

Expected output:
```
✅ Camps seeded
✅ Users seeded (password: iragi2025)
✅ Sample refugees seeded
✅ Sample cases seeded
✅ Inventory seeded
✅ Distributions seeded
✅ IRAGI database seeded successfully!

📋 Login credentials:
   Super Admin:  admin@iragi.org   / iragi2025
   Camp Admin:   alice@iragi.org   / iragi2025
   Field Worker: marie@iragi.org   / iragi2025
```

---

## ── STEP 7 — START THE BACKEND SERVER ──────────────────────────

```bash
# Development mode (auto-restarts on file changes)
npm run dev
```

Expected output:
```
🚀 IRAGI Backend running on http://localhost:5000
   Environment: development
   Database:    iragi@localhost
✅ PostgreSQL connected
```

Test it by visiting: http://localhost:5000/health
You should see: `{"status":"ok","org":"IRAGI","version":"1.0.0"}`

Leave this terminal running! Open a new terminal for the next step.

---

## ── STEP 8 — INSTALL FRONTEND DEPENDENCIES ─────────────────────

Open a **new terminal** in VSCode:

```bash
# Navigate to frontend folder
cd frontend

# Install all packages
npm install
```

---

## ── STEP 9 — START THE FRONTEND ────────────────────────────────

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

Open your browser and go to: **http://localhost:3000**

You should see the IRAGI login page! 🎉

---

## ── STEP 10 — LOGIN AND EXPLORE ────────────────────────────────

Use these demo accounts:

| Role         | Email                | Password   | Access Level          |
|--------------|----------------------|------------|-----------------------|
| Super Admin  | admin@iragi.org      | iragi2025  | Full access           |
| Camp Admin   | alice@iragi.org      | iragi2025  | Camp + refugees       |
| Field Worker | marie@iragi.org      | iragi2025  | Register + cases      |
| Auditor      | auditor@iragi.org    | iragi2025  | Read-only             |

---

## ── PROJECT STRUCTURE ───────────────────────────────────────────

```
iragi/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js           ← PostgreSQL connection
│   │   │   ├── migrate.js      ← Creates all database tables
│   │   │   └── seed.js         ← Inserts demo data
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── refugeesController.js
│   │   │   ├── casesController.js
│   │   │   ├── campsController.js
│   │   │   ├── distributionsController.js
│   │   │   ├── usersController.js
│   │   │   └── dashboardController.js
│   │   ├── middleware/
│   │   │   ├── auth.js         ← JWT authentication
│   │   │   └── audit.js        ← Action logging
│   │   ├── routes/
│   │   │   └── index.js        ← All API routes
│   │   └── server.js           ← Express app entry point
│   ├── .env.example            ← Copy this to .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   └── Layout.jsx  ← Sidebar + header shell
    │   │   └── ui/
    │   │       ├── RefugeeModal.jsx
    │   │       └── CaseModal.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx  ← Login state
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── RefugeesPage.jsx
    │   │   ├── RefugeeDetail.jsx
    │   │   ├── CasesPage.jsx
    │   │   ├── CaseDetail.jsx
    │   │   ├── CampsPage.jsx
    │   │   ├── DistributionsPage.jsx
    │   │   ├── UsersPage.jsx
    │   │   └── ReportsPage.jsx
    │   ├── utils/
    │   │   └── api.js           ← Axios instance
    │   ├── App.jsx              ← Routes
    │   ├── main.jsx             ← Entry point
    │   └── index.css            ← Tailwind + custom styles
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## ── API ENDPOINTS REFERENCE ─────────────────────────────────────

```
POST   /api/auth/login           ← Login
GET    /api/auth/me              ← Get current user
GET    /api/dashboard            ← Dashboard stats

GET    /api/refugees             ← List with filters
POST   /api/refugees             ← Register new
GET    /api/refugees/:id         ← Get detail
PUT    /api/refugees/:id         ← Update
DELETE /api/refugees/:id         ← Delete (super_admin only)
GET    /api/refugees/stats       ← Aggregate stats

GET    /api/cases                ← List with filters
POST   /api/cases                ← Create case
GET    /api/cases/:id            ← Get with notes
PUT    /api/cases/:id            ← Update
POST   /api/cases/:id/notes      ← Add note

GET    /api/camps                ← List camps
POST   /api/camps                ← Create camp
GET    /api/camps/:id/inventory  ← Camp inventory

GET    /api/distributions        ← List
POST   /api/distributions        ← Log (duplicate check built in)
GET    /api/distributions/summary ← Daily summary

GET    /api/users                ← List (super_admin only)
POST   /api/users                ← Create user
PUT    /api/users/:id            ← Update user

GET    /api/audit-logs           ← Audit log (admin/auditor)
```

---

## ── COMMON ISSUES & FIXES ───────────────────────────────────────

**Error: password authentication failed for user "postgres"**
→ Open your `.env` file and correct the `DB_PASSWORD` value.
→ Make sure PostgreSQL is running (check Services on Windows, or `pg_ctl status` on Mac/Linux).

**Error: database "iragi" does not exist**
→ Go back to Step 2 and create the database in pgAdmin first.

**CORS error in browser**
→ Make sure your backend is running on port 5000.
→ Check that `FRONTEND_URL=http://localhost:3000` is set in `.env`.

**Port already in use**
→ Change `PORT=5000` in backend `.env` or kill the process using the port.

**Cannot find module**
→ Make sure you ran `npm install` in both `backend/` and `frontend/` directories.

---

## ── NEXT STEPS (AFTER MVP) ──────────────────────────────────────

- Add Cloudinary for real photo uploads (fill in `.env` values)
- Deploy backend to **Railway** (railway.app) — free tier available
- Deploy frontend to **Vercel** (vercel.com) — free tier available
- Add service worker for true offline mode (Workbox)
- Add Arabic/Swahili translations (react-i18next)
- Connect to UNHCR PRIMES API for data interoperability

---

*IRAGI Refugee Management System © 2025 — Built for the people who need it most.*
