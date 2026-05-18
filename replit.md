# SabayTenh (សប្បាយទិញ)

Cambodia's #1 Walmart-style eCommerce marketplace — groceries, electronics, clothing, and more — with Khmer/English language switcher, KHQR payment simulation, and a full admin panel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/sabaytenh run dev` — run the frontend (Vite)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Wouter + TanStack Query + shadcn/ui + Tailwind CSS
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT + bcrypt (stored in `localStorage`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Charts: Recharts
- Build: esbuild (CJS bundle for API)

## Where things live

- `artifacts/sabaytenh/` — React/Vite frontend
  - `src/pages/` — all customer pages (home, products, cart, checkout, orders, account, wishlist)
  - `src/pages/admin/` — all admin pages (dashboard, orders, products, inventory, users)
  - `src/components/layout/` — Navbar, RootLayout, ProtectedRoute
  - `src/contexts/` — AuthContext (JWT), LanguageContext (KH/EN)
  - `src/index.css` — Kantumruy Pro font + orange/green theme tokens
- `artifacts/api-server/` — Express 5 API server
  - `src/routes/` — all route handlers
  - `src/middleware/` — auth middleware
- `lib/db/` — Drizzle ORM schema + migrations
- `lib/api-spec/` — OpenAPI 3.1 spec (source of truth for API contract)
- `lib/api-client-react/` — Orval-generated React Query hooks + custom-fetch

## Architecture decisions

- **Contract-first API**: OpenAPI spec defined first → Orval generates TypeScript hooks + Zod schemas. Never write fetch calls manually.
- **No base URL set**: Generated hooks use `/api/...` absolute paths. The reverse proxy routes `/api` to the API server — no `setBaseUrl` needed for web.
- **JWT in localStorage**: Simple for demo; auth token attached via `setAuthTokenGetter` in `AuthContext`.
- **Admin routing**: Same Express app serves all roles. `ProtectedRoute` component enforces role-based access on the frontend (`allowedRoles` prop).
- **KHQR simulation**: Checkout generates a fake QR grid pattern in-browser — no real payment integration needed for demo.

## Product

- **Customer features**: Browse 51 products across 12 categories/15 brands, add to cart, wishlist, checkout with KHQR/bank/cash payment simulation, order tracking with status timeline, account management.
- **Admin features**: Dashboard with 30-day sales chart + KPI cards, order management with status updates, product CRUD with image/featured/discount support, inventory management with low-stock alerts, user role management.
- **Khmer/English**: Full `t(en, kh)` language toggle throughout all pages.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sabaytenh.com | password123 |
| Staff | staff@sabaytenh.com | password123 |
| Customer | customer@gmail.com | password123 |

## User preferences

- Khmer + English bilingual throughout (no third language)
- Orange primary (#F97316), green secondary for Cambodian feel
- Kantumruy Pro font for Khmer text
- KHQR, ABA, Wing, ACLEDA payment methods simulated

## Gotchas

- Do NOT call `setBaseUrl` with `/api` — the generated hooks already prefix paths with `/api/...`. Setting it causes double `/api/api/...` routing.
- `InventoryUpdate` uses `{ stock: number }` not `quantity`.
- `DashboardSummary` has `totalUsers` (not `totalCustomers`) and `lowStockCount` (a number, not an array).
- `useListOrders` accepts `ListOrdersParams` — no `all` param.
- `useUpdateOrderStatus` / `useUpdateProduct` / `useDeleteProduct` / `useUpdateUserRole` all use `{ id }` not `{ orderId / productId / userId }`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `lib/api-spec/openapi.yaml` for the full API contract
