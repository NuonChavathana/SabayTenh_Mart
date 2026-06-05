# Database (MySQL + Drizzle)

## MySQL Workbench connection

Start MySQL (Docker):

```bash
pnpm run db:up
```

In **MySQL Workbench** → *Database* → *Connect to Database*:

| Field | Value |
|-------|--------|
| Hostname | `127.0.0.1` |
| Port | `3306` |
| Username | `sabaytenh` |
| Password | `sabaytenh` |
| Default schema | `SabayTenh_Mart` |

Root access (optional): user `root`, password `root`.

## Apply schema and seed data

From the repo root (after `cp .env.example .env`):

```bash
pnpm install
pnpm run db:setup
```

Demo users (password `password123`): `admin@sabaytenh.com`, `staff@sabaytenh.com`, `customer@gmail.com`.

## Commands

```bash
pnpm run db:up      # start MySQL container
pnpm run db:down    # stop MySQL container
pnpm run db:setup   # push Drizzle schema + seed
```
