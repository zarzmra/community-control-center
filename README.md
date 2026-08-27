# Community Control Center (CCC)

Welcome to the **Community Control Center (CCC)**, a modular and highly scalable platform designed to manage community interactions, bots, integrations, and services.

This project is built using **Next.js** (App Router), **TypeScript**, **ESLint**, and **Vanilla CSS** for design and styling flexibility.

---

## 🚀 Project Status

The application includes a working administration UI and CRUD API for communities, bots, channels and automations. PostgreSQL is required for persistent data. Authentication uses Auth.js (NextAuth) with email/password and two roles: `admin` and `member`.

### What is Included:
- **Next.js 16 / React 19** with App Router.
- **TypeScript & ESLint** fully configured.
- **Vanilla CSS** modules styling pattern.
- **Modular Directory Layout** (`src/modules`, `src/lib`, `src/components`, `src/types`) ready to scale.
- Environment variable template (`.env.example`) aligned with the local Docker setup.
- Ignored-by-default environment configurations (`.env`, `.env.*.local`) in `.gitignore`, keeping `.env.example` in Git.
- Versioned PostgreSQL migrations plus an idempotent migration command.

---

## 🛠️ Prerequisites

Before working on this project, ensure you have the following installed:
- **Node.js** (v24.x recommended)
- **npm** (v11.x recommended)
- **Git**
- **Docker** and **Docker Compose** (for local PostgreSQL)

---

## 🏃‍♂️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the template environment variables file to a local version:
```bash
cp .env.example .env.local
```
> ⚠️ **Note:** `.env.local` is ignored by Git. Never commit credentials to the repository.

For local development, start PostgreSQL with Docker:
```bash
npm run db:up
```

Generate an Auth.js secret, set it in `.env.local`, then create the initial administrator:
```bash
openssl rand -base64 32
npm run db:migrate
npm run db:seed-admin
```

Set `AUTH_SECRET`, `ADMIN_NAME`, `ADMIN_EMAIL`, and an `ADMIN_PASSWORD` of at least 12 characters before running the last command. Administrators can modify data; members have read-only API access.

### 3. Run Development Server
```bash
npm run db:migrate
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

`npm run db:migrate` creates the tables required by the API and records each applied migration in `schema_migrations`. It can be safely run again.

To stop the local database and remove its container, run `npm run db:down`. Its named volume is kept so data survives restarts.

### 4. Build for Production
To verify compiling and build optimization:
```bash
npm run build
```

---

## 📂 Modular Architecture Overview

```text
community-control-center/
├── public/                 # Static assets
└── src/
    ├── app/                # App Router (Pages, layouts, API routes)
    ├── components/         # Domain-agnostic reusable UI elements
    ├── lib/                # Database/Redis clients and common helpers
    ├── modules/            # Business features/domains (e.g. bots, dashboard)
    └── types/              # Global TypeScript type definitions
```

Each subdirectory within `src/` contains a local `README.md` with guidelines on how to structure additions.
