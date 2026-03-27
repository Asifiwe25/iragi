# IRAGI — Guide de Configuration v2.0
## React + Node.js + PostgreSQL · Prêt pour Vercel + Railway

---

## STRUCTURE DU PROJET

```
iragi/
├── frontend/                       ← Déployer sur VERCEL
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   └── HomePage.jsx    ← ✨ Homepage publique animée
│   │   │   ├── LoginPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── ... (autres pages)
│   │   ├── components/layout/Layout.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── utils/api.js
│   │   ├── App.jsx                 ← / (public) + /app/* (protégé)
│   │   └── index.css               ← Animations + design system
│   ├── .env.example
│   ├── .env.local                  ← Dev local
│   ├── vercel.json                 ← Rewrites Vercel
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                        ← Déployer sur RAILWAY
│   ├── src/
│   │   ├── config/db.js            ← Support DATABASE_URL
│   │   ├── config/migrate.js
│   │   ├── config/seed.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.js               ← CORS multi-origines
│   ├── .env.example
│   └── package.json
│
└── SETUP_GUIDE.md
```

---

## ROUTES

| URL | Accès |
|-----|-------|
| `/` | Homepage publique |
| `/login` | Connexion |
| `/app` | Dashboard |
| `/app/refugees` | Réfugiés |
| `/app/cases` | Cas |
| `/app/camps` | Camps |
| `/app/distributions` | Distributions |
| `/app/reports` | Rapports |
| `/app/users` | Users (super_admin) |

---

## ÉTAPE 1 — BACKEND (local)

```bash
cd backend
cp .env.example .env
# Remplir DB_PASSWORD dans .env

npm install
node src/config/migrate.js
node src/config/seed.js
npm run dev
# → http://localhost:5000
```

---

## ÉTAPE 2 — FRONTEND (local)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## COMPTES DE DÉMO

| Rôle | Email | Password |
|------|-------|----------|
| Super Admin | admin@iragi.org | iragi2025 |
| Camp Admin | alice@iragi.org | iragi2025 |
| Field Worker | marie@iragi.org | iragi2025 |

---

## DÉPLOIEMENT VERCEL (Frontend)

1. Push sur GitHub
2. Vercel → New Project → Import repo
3. **Root Directory** : `frontend`
4. **Framework** : Vite
5. Variable d'env : `VITE_API_URL` = `https://ton-backend.railway.app/api`
6. Deploy ✅

Mettre à jour `frontend/vercel.json` avec l'URL Railway :
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://TON-BACKEND.railway.app/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## DÉPLOIEMENT RAILWAY (Backend)

1. Railway → New Project → Deploy from GitHub → dossier `backend`
2. Add Database → PostgreSQL (Railway injecte DATABASE_URL auto)
3. Variables : `NODE_ENV=production`, `JWT_SECRET=...`, `FRONTEND_URL=https://iragi.vercel.app`
4. Terminal Railway : `node src/config/migrate.js` puis `node src/config/seed.js`

---

## DESIGN SYSTEM

| Background | `#0d0c0a` |
| Gold accent | `#c9a84c` |
| Font Display | Cormorant Garamond |
| Font Interface | Syne |
| Font Body | DM Sans |

---

*IRAGI © 2025 — "Un don sacré des ancêtres"*
