# Community Control Center (CCC)

Welcome to the **Community Control Center (CCC)**, a modular and highly scalable platform designed to manage community interactions, bots, integrations, and services.

This project is built using **Next.js** (App Router), **TypeScript**, **ESLint**, and **Vanilla CSS** for design and styling flexibility.

---

## 🚀 Project Status: Phase 1 (Next.js Skeleton)

We are currently in **Phase 1: Environment & Initial Skeleton**. The basic configuration has been successfully initialized and validated.

### What is Included:
- **Next.js 16 / React 19** with App Router.
- **TypeScript & ESLint** fully configured.
- **Vanilla CSS** modules styling pattern.
- **Modular Directory Layout** (`src/modules`, `src/lib`, `src/components`, `src/types`) ready to scale.
- Environment variable template (`.env.example`) with secure placeholders.
- Ignored-by-default environment configurations (`.env`, `.env.*.local`) in `.gitignore`, keeping `.env.example` in Git.

---

## 🛠️ Prerequisites

Before working on this project, ensure you have the following installed:
- **Node.js** (v24.x recommended)
- **npm** (v11.x recommended)
- **Git**
- **Docker** and **Docker Compose** (for future database/redis services in later phases)

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

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

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
