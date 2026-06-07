<h1 align="center">🛒 SabayTenh Mart — សប្បាយទិញ</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black">
  <img src="https://img.shields.io/badge/Backend-Express.js%205-000000?style=for-the-badge&logo=express">
  <img src="https://img.shields.io/badge/Database-MySQL%208-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel">
  <img src="https://img.shields.io/badge/Backend-Railway-7B2FBE?style=for-the-badge&logo=railway">
  <img src="https://img.shields.io/badge/Images-Cloudinary-3448C5?style=for-the-badge&logo=cloudinary">
  <img src="https://img.shields.io/badge/Status-Live%20✅-success?style=for-the-badge">
</p>

<p align="center">
  <a href="https://sabay-tenh-mart.vercel.app">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-sabay--tenh--mart.vercel.app-F96167?style=for-the-badge">
  </a>
</p>

<hr>

<h2>📚 About This Project</h2>

<p>
This repository contains a full-stack <b>eCommerce Platform</b> called <b>SabayTenh Mart (សប្បាយទិញ)</b>, developed as a university <b>Database Systems</b> final project — Semester 2, Year 3.
</p>

<p>
The system provides a complete digital solution for Cambodian mini-mart businesses — covering online shopping, inventory management, point-of-sale operations, coupon system, and real-time Telegram order notifications.
</p>

<h3>🎯 Main Goals</h3>
<ul>
  <li>Design and implement a normalized relational MySQL database (11 tables, BCNF)</li>
  <li>Build a full-stack web application with React 19 + Express.js 5 + MySQL 8</li>
  <li>Practice database concepts: JOIN, transactions, foreign keys, constraints</li>
  <li>Implement role-based access control (Admin / Staff / Customer)</li>
  <li>Deploy a live production system with real cloud database hosting</li>
</ul>

<hr>

<h2>🌐 Live Demo</h2>

<table align="center">
  <tr>
    <th>Service</th>
    <th>URL</th>
  </tr>
  <tr>
    <td>🛍️ Customer Store</td>
    <td><a href="https://sabay-tenh-mart.vercel.app">sabay-tenh-mart.vercel.app</a></td>
  </tr>
  <tr>
    <td>⚙️ Admin Panel</td>
    <td><a href="https://sabay-tenh-mart.vercel.app/admin">sabay-tenh-mart.vercel.app/admin</a></td>
  </tr>
  <tr>
    <td>🖥️ POS Cashier</td>
    <td><a href="https://sabay-tenh-mart.vercel.app/admin/pos">sabay-tenh-mart.vercel.app/admin/pos</a></td>
  </tr>
  <tr>
    <td>🔌 Backend API</td>
    <td><a href="https://sabaytenhmart-production.up.railway.app">sabaytenhmart-production.up.railway.app</a></td>
  </tr>
</table>

<h3>🔑 Demo Accounts</h3>
<table align="center">
  <tr>
    <th>Role</th>
    <th>Email</th>
    <th>Password</th>
  </tr>
  <tr>
    <td>👑 Admin</td>
    <td>admin@sabaytenh.com</td>
    <td>password123</td>
  </tr>
  <tr>
    <td>👷 Staff</td>
    <td>staff@sabaytenh.com</td>
    <td>password123</td>
  </tr>
  <tr>
    <td>🛒 Customer</td>
    <td>customer@sabaytenh.com</td>
    <td>password123</td>
  </tr>
</table>

<hr>

<h2>⚙️ Technologies Used</h2>

<h3>🎨 Frontend</h3>
<ul>
  <li>React 19</li>
  <li>TypeScript</li>
  <li>Vite</li>
  <li>TailwindCSS</li>
  <li>React Query (TanStack Query)</li>
  <li>Wouter (Router)</li>
  <li>shadcn/ui + Radix UI</li>
  <li>Lucide React (Icons)</li>
</ul>

<h3>🧠 Backend</h3>
<ul>
  <li>Express.js 5</li>
  <li>Node.js 20</li>
  <li>TypeScript</li>
  <li>JWT Authentication</li>
  <li>Drizzle ORM</li>
  <li>Multer (File Upload)</li>
  <li>Cloudinary (Image Storage)</li>
  <li>Telegram Bot API (Order Alerts)</li>
</ul>

<h3>🗄️ Database</h3>
<ul>
  <li>MySQL 8.0 (InnoDB Engine)</li>
  <li>Drizzle Kit (Migrations)</li>
  <li>MySQL Workbench</li>
  <li>Railway MySQL (Cloud Hosting)</li>
  <li>11 Tables — Normalized to BCNF</li>
</ul>

<h3>🚀 DevOps & Tools</h3>
<ul>
  <li>Vercel (Frontend Deploy)</li>
  <li>Railway (Backend + DB Deploy)</li>
  <li>Docker (Containerization)</li>
  <li>pnpm Monorepo</li>
  <li>GitHub (Version Control)</li>
  <li>Zod (Schema Validation)</li>
</ul>

<hr>

<h2>🔄 System Architecture</h2>

<pre>
Customer Browser / Admin Panel / POS Cashier
              ↓
    Vercel (React 19 + Vite)
     CDN Edge Network
              ↓  HTTPS / REST API
    Railway (Express.js 5 + Node.js 20)
     JWT Auth · Drizzle ORM · Docker
              ↓  SQL Queries
    MySQL 8 Database (Railway Cloud)
     11 Tables · InnoDB Engine · BCNF
              ↓
    ┌─────────────────────────┐
    │  Cloudinary  │ Telegram │
    │  (Images CDN)│ (Alerts) │
    └─────────────────────────┘
</pre>

<hr>

<h2>🗄️ Database Design</h2>

<h3>📊 11 Tables Overview</h3>

<table align="center">
  <tr>
    <th>Table</th>
    <th>Purpose</th>
    <th>Foreign Keys</th>
  </tr>
  <tr>
    <td><code>users</code></td>
    <td>All system users (Admin, Staff, Customer)</td>
    <td>—</td>
  </tr>
  <tr>
    <td><code>products</code></td>
    <td>Product catalog with price and stock</td>
    <td>→ categories, brands</td>
  </tr>
  <tr>
    <td><code>categories</code></td>
    <td>Product categories (Khmer + English)</td>
    <td>—</td>
  </tr>
  <tr>
    <td><code>brands</code></td>
    <td>Product brands</td>
    <td>—</td>
  </tr>
  <tr>
    <td><code>orders</code></td>
    <td>Customer orders with totals and status</td>
    <td>→ users</td>
  </tr>
  <tr>
    <td><code>order_items</code></td>
    <td>Individual items per order</td>
    <td>→ orders, products</td>
  </tr>
  <tr>
    <td><code>carts</code></td>
    <td>Shopping carts</td>
    <td>→ users</td>
  </tr>
  <tr>
    <td><code>cart_items</code></td>
    <td>Items in cart</td>
    <td>→ carts, products</td>
  </tr>
  <tr>
    <td><code>coupons</code></td>
    <td>Discount coupons (percentage or flat)</td>
    <td>—</td>
  </tr>
  <tr>
    <td><code>reviews</code></td>
    <td>Product reviews and ratings</td>
    <td>→ users, products</td>
  </tr>
  <tr>
    <td><code>wishlists</code></td>
    <td>User saved products</td>
    <td>→ users, products</td>
  </tr>
  <tr>
    <td><code>inventory_logs</code></td>
    <td>Stock change history log</td>
    <td>→ products</td>
  </tr>
</table>

<hr>

<h2>✨ Features</h2>

<h3>👤 Customer Side</h3>
<ul>
  <li>User Registration and Login (JWT Auth)</li>
  <li>Product browsing with categories and brands</li>
  <li>Search and filter by price, rating, and brand</li>
  <li>Shopping cart with quantity management</li>
  <li>Coupon codes (percentage or flat discount)</li>
  <li>Delivery fee calculation (free over $30)</li>
  <li>KHQR / ABA / ACLEDA payment simulation</li>
  <li>Product reviews and wishlist</li>
  <li>Khmer and English language toggle</li>
  <li>Dark / Light mode support</li>
</ul>

<h3>🛠️ Admin Dashboard</h3>
<ul>
  <li>Full product CRUD with Cloudinary image upload</li>
  <li>Order management and status tracking</li>
  <li>Real-time inventory with low-stock alerts</li>
  <li>User management with role assignment</li>
  <li>Coupon creation and management</li>
  <li>Sales overview and analytics dashboard</li>
  <li>POS cashier system for in-store sales</li>
  <li>Real-time Telegram order notifications</li>
</ul>

<hr>

<h2>📁 Project Structure</h2>

<pre>
SabayTenh_Mart/                   ← pnpm Monorepo Root
│
├── 📁 frontend/                  ← React 19 + Vite (Vercel)
│   ├── src/
│   │   ├── pages/                ← Route pages (home, checkout, admin...)
│   │   ├── components/           ← Reusable UI components
│   │   ├── contexts/             ← Auth and Language context
│   │   ├── hooks/                ← Custom React hooks
│   │   └── lib/                  ← Utilities (images, discount)
│   └── vercel.json               ← Vercel config + API proxy
│
├── 📁 backend/                   ← Express.js 5 API (Railway)
│   └── src/
│       ├── routes/               ← API endpoints (products, orders...)
│       ├── middleware/           ← Auth, upload, validation
│       └── services/             ← Telegram notification service
│
├── 📁 database/                  ← MySQL + Drizzle ORM
│   ├── schema/                   ← Table definitions (11 tables)
│   ├── seeds/                    ← Seed data (users, products...)
│   └── drizzle.config.ts
│
├── 📁 packages/
│   ├── api-zod/                  ← Shared Zod schemas and types
│   └── api-client-react/         ← Auto-generated React Query hooks
│
├── Dockerfile                    ← Railway Docker build
├── railway.json                  ← Railway deployment config
└── pnpm-workspace.yaml           ← Monorepo workspace config
</pre>

<hr>

<h2>🚀 Getting Started</h2>

<h3>Prerequisites</h3>
<ul>
  <li>Node.js >= 20</li>
  <li>pnpm >= 9</li>
  <li>MySQL 8.0</li>
</ul>

<h3>Installation</h3>

<pre>
# 1. Clone the repository
git clone https://github.com/NuonChavathana/SabayTenh_Mart.git
cd SabayTenh_Mart

# 2. Install all dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env

# 4. Start MySQL (Docker)
pnpm run db:up

# 5. Push schema and seed database
pnpm run db:setup

# 6. Run development servers
pnpm run dev:backend    # → http://localhost:8080
pnpm run dev:frontend   # → http://localhost:8081
</pre>

<hr>

<h2>🔐 Security</h2>
<ul>
  <li><b>JWT Authentication</b> — Stateless token auth, expires after 7 days</li>
  <li><b>Role-Based Access Control</b> — Admin / Staff / Customer permissions</li>
  <li><b>bcrypt Password Hashing</b> — Salt rounds: 10, plain passwords never stored</li>
  <li><b>Environment Variables</b> — API keys in .env, protected by .gitignore</li>
  <li><b>requireAuth Middleware</b> — All protected routes return 401 if unauthorized</li>
</ul>

<hr>

<h2>📌 Current Progress</h2>
<p>
✅ MySQL Database with 11 Tables Designed and Deployed <br>
✅ Backend REST API Built and Running on Railway <br>
✅ Frontend eCommerce Store Live on Vercel <br>
✅ Admin Dashboard with Full CRUD Implemented <br>
✅ POS Cashier System Completed <br>
✅ JWT Authentication and Role-Based Access Added <br>
✅ Cloudinary Image Upload Integrated <br>
✅ Telegram Order Notifications Working <br>
✅ Coupon and Discount System Live <br>
✅ Khmer and English Language Support Added
</p>

<hr>

<h2>💡 Future Improvements</h2>
<ul>
  <li>Real KHQR Bakong and ABA PayWay payment integration</li>
  <li>React Native mobile app for iOS and Android</li>
  <li>Advanced sales analytics and revenue forecasting</li>
  <li>AI-based product recommendation engine</li>
  <li>Multi-vendor marketplace support</li>
  <li>Redis caching layer for high-traffic optimization</li>
  <li>Database indexing and query optimization</li>
</ul>

<hr>

<h2>🧑‍💻 Author</h2>

<p align="center">
  <img src="https://img.shields.io/badge/Student-Nuon%20Chavathana-065A82?style=for-the-badge">
  <img src="https://img.shields.io/badge/Course-Database%20Systems-1C7293?style=for-the-badge">
  <img src="https://img.shields.io/badge/Year-3%20Semester%202-F96167?style=for-the-badge">
</p>

<table align="center">
  <tr>
    <th>Name</th>
    <th>Role</th>
    <th>GitHub</th>
  </tr>
  <tr>
    <td><b>Nuon Chavathana</b></td>
    <td>Full-Stack Developer</td>
    <td><a href="https://github.com/NuonChavathana">@NuonChavathana</a></td>
  </tr>
</table>

<hr>

<p align="center">
  Built with ❤️ using <b>React</b> + <b>Express</b> + <b>MySQL</b> + <b>TypeScript</b>
  <br/><br/>
  ⭐ Star this repo if you find it useful!
</p>
