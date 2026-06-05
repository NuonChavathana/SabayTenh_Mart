# SabayTenh Mart

Full-stack eCommerce monorepo (React + Express + MySQL).

## Project layout

| Path | Purpose |
|------|---------|
| `frontend/` | React 19 + Vite storefront |
| `backend/` | Express 5 API server |
| `database/` | Drizzle ORM schema and DB tooling |
| `packages/` | Shared Zod types and React Query API client |

## Prerequisites

- Node.js 24+
- [pnpm](https://pnpm.io/) (workspace uses pnpm only)
- [Docker](https://www.docker.com/) for MySQL (or your own MySQL 8+ server)
- [MySQL Workbench](https://www.mysql.com/products/workbench/) (optional, to browse/edit data)

## Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Start MySQL:

   ```bash
   pnpm run db:up
   ```

3. Install dependencies and create tables + demo data:

   ```bash
   pnpm install
   pnpm run db:setup
   ```

   Demo logins: `admin@sabaytenh.com` / `password123` (also staff & customer in seed)

See [database/README.md](./database/README.md) for **MySQL Workbench** connection details.

## Run

**API server** (port 8080):

```bash
pnpm --filter @workspace/api-server run dev
```

**Frontend** (port 8081, proxies `/api` to the API):

```bash
pnpm --filter @workspace/sabaytenh run dev
```

**Both** (from repo root):

```bash
pnpm run dev:backend
pnpm run dev:frontend
```

## Other commands

```bash
pnpm run typecheck          # Typecheck all packages
pnpm run build              # Build all packages
pnpm run db:down            # Stop MySQL container
```
