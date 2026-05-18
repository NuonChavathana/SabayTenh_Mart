import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable, usersTable, orderItemsTable, categoriesTable } from "@workspace/db";
import { eq, desc, sql, gte, lte, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, requireRole("staff", "cashier", "admin"), async (_req, res): Promise<void> => {
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

router.get("/dashboard/sales", requireAuth, requireRole("staff", "cashier", "admin"), async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT
      to_char(date_series.d, 'YYYY-MM-DD') AS date,
      COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total::numeric ELSE 0 END), 0) AS revenue,
      COUNT(id) AS orders
    FROM generate_series(
      NOW() - INTERVAL '29 days',
      NOW(),
      '1 day'::interval
    ) AS date_series(d)
    LEFT JOIN orders ON date(orders.created_at) = date(date_series.d)
    GROUP BY date_series.d
    ORDER BY date_series.d
  `);
  const result = (rows as any).rows ?? (rows as any);
  res.json((result as any[]).map((r: any) => ({ date: r.date, revenue: parseFloat(r.revenue), orders: parseInt(r.orders, 10) })));
});

router.get("/dashboard/recent-orders", requireAuth, requireRole("staff", "cashier", "admin"), async (_req, res): Promise<void> => {
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
