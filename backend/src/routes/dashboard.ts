import { Router, type IRouter } from "express";
import {
  db,
  ordersTable,
  productsTable,
  usersTable,
  orderItemsTable,
  categoriesTable,
  eq,
  desc,
  sql,
  gte,
  lte,
  and,
} from "@workspace/db";
import { requireAuth, requireRole } from "../middleware/auth";

const router: IRouter = Router();

router.get("/summary", requireAuth, requireRole("staff", "cashier", "admin"), async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalRevenueRow] = await db.select({ sum: sql<number>`coalesce(sum(total), 0)`.mapWith(Number) }).from(ordersTable).where(eq(ordersTable.paymentStatus, "paid"));
  const [totalOrdersRow] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(ordersTable);
  const [totalProductsRow] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(productsTable);
  const [totalUsersRow] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(usersTable);
  const [todayRevenueRow] = await db.select({ sum: sql<number>`coalesce(sum(total), 0)`.mapWith(Number) }).from(ordersTable).where(and(gte(ordersTable.createdAt, today), eq(ordersTable.paymentStatus, "paid")));
  const [todayOrdersRow] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(ordersTable).where(gte(ordersTable.createdAt, today));
  const [lowStockRow] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(productsTable).where(lte(productsTable.stock, productsTable.lowStockThreshold));
  const [pendingRow] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(ordersTable).where(eq(ordersTable.status, "pending"));

  const topCategoriesRows = await db
    .select({ categoryName: categoriesTable.name, revenue: sql<number>`coalesce(sum(oi.price * oi.quantity), 0)`.mapWith(Number), orderCount: sql<number>`count(distinct o.id)`.mapWith(Number) })
    .from(categoriesTable)
    .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
    .leftJoin(sql`order_items oi`, sql`oi.product_id = ${productsTable.id}`)
    .leftJoin(sql`orders o`, sql`o.id = oi.order_id`)
    .groupBy(categoriesTable.name)
    .orderBy(desc(sql`coalesce(sum(oi.price * oi.quantity), 0)`))
    .limit(5);

  const bestSellersRows = await db
    .select({ product: productsTable })
    .from(productsTable)
    .orderBy(desc(productsTable.soldCount))
    .limit(5);

  const bestSellers = bestSellersRows.map(r => ({
    id: r.product.id,
    name: r.product.name,
    nameKh: r.product.nameKh,
    description: r.product.description,
    price: parseFloat(String(r.product.price)),
    originalPrice: r.product.originalPrice ? parseFloat(String(r.product.originalPrice)) : null,
    discountPercent: r.product.discountPercent,
    image: r.product.image,
    categoryId: r.product.categoryId,
    categoryName: null,
    brandId: r.product.brandId,
    brandName: null,
    stock: r.product.stock,
    rating: null,
    reviewCount: 0,
    isFeatured: r.product.isFeatured,
    tags: r.product.tags,
  }));

  res.json({
    totalRevenue: totalRevenueRow?.sum ?? 0,
    totalOrders: totalOrdersRow?.count ?? 0,
    totalProducts: totalProductsRow?.count ?? 0,
    totalUsers: totalUsersRow?.count ?? 0,
    todayRevenue: todayRevenueRow?.sum ?? 0,
    todayOrders: todayOrdersRow?.count ?? 0,
    lowStockCount: lowStockRow?.count ?? 0,
    pendingOrders: pendingRow?.count ?? 0,
    topCategories: topCategoriesRows.map(r => ({ categoryName: r.categoryName ?? "Unknown", revenue: r.revenue, orderCount: r.orderCount })),
    bestSellers,
  });
});

router.get("/sales", requireAuth, requireRole("staff", "cashier", "admin"), async (_req, res): Promise<void> => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 29);

  const orders = await db
    .select({
      total: ordersTable.total,
      paymentStatus: ordersTable.paymentStatus,
      createdAt: ordersTable.createdAt,
    })
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, start));

  const byDate = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    byDate.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const row = byDate.get(key);
    if (!row) continue;
    row.orders += 1;
    if (order.paymentStatus === "paid") {
      row.revenue += parseFloat(String(order.total));
    }
  }

  res.json(
    [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        revenue: stats.revenue,
        orders: stats.orders,
      })),
  );
});

router.get("/recent-orders", requireAuth, requireRole("staff", "cashier", "admin"), async (_req, res): Promise<void> => {
  const rows = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(10);
  const result = await Promise.all(rows.map(async (order) => {
    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, order.userId));
    const [countRow] = await db.select({ itemCount: sql<number>`sum(quantity)`.mapWith(Number) }).from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    return {
      id: order.id,
      userId: order.userId,
      customerName: user?.name ?? null,
      status: order.status,
      subtotal: parseFloat(String(order.subtotal)),
      discount: parseFloat(String(order.discount)),
      total: parseFloat(String(order.total)),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress,
      itemCount: countRow?.itemCount ?? 0,
      createdAt: order.createdAt.toISOString(),
    };
  }));
  res.json(result);
});

export default router;
