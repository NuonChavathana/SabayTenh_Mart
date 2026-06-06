# SabayTenh Mart (សប្បាយទិញ)

Full-stack eCommerce platform built with React + Express + MySQL.

## 🌐 Live Demo
- **Website:** https://sabay-tenh-mart.vercel.app
- **Admin Panel:** https://sabay-tenh-mart.vercel.app/admin
- **Demo Login:** admin@sabaytenh.com / password123

## 👥 Team Members
- Nuon Chavathana
- Phet Narin
- Oun Sivting
## 🛠️ Tech Stack
- **Frontend:** React 19, TypeScript, Vite, TailwindCSS
- **Backend:** Express 5, Node.js
- **Database:** MySQL 8, Drizzle ORM
- **Image Storage:** Cloudinary
- **Deployment:** Railway (Backend + DB), Vercel (Frontend)

## 📁 Project Structure

| Path | Purpose |
|---|---|
| `frontend/` | React 19 + Vite storefront |
| `backend/` | Express 5 API server |
| `database/` | Drizzle ORM schema and DB tooling |
| `packages/` | Shared Zod types and React Query API client |

## ✨ Features
- 🛒 Shopping Cart & Checkout
- 👤 User Authentication (Admin, Staff, Customer)
- 📦 Product Management (Admin Panel)
- 🏷️ Categories & Brands
- 💰 Coupons & Discounts
- 📊 POS Cashier System
- 📱 Telegram Notifications
- 🌙 Dark Mode
- 🇰🇭 Khmer & English Language

## 🚀 Setup (Local)

1. Copy environment variables:
```bash
cp .env.example .env
```

2. Start MySQL:
```bash
pnpm run db:up
```

3. Install and setup:
```bash
pnpm install
pnpm run db:setup
```

4. Run development:
```bash
pnpm run dev:backend
pnpm run dev:frontend
```

## 📚 About
This is a Database project for Semester 2 Year 3.