import { Router, type IRouter } from "express";
import {
  db,
  ordersTable,
  orderItemsTable,
  cartsTable,
  cartItemsTable,
  productsTable,
  usersTable,
  couponsTable,
  eq,
  desc,
  sql,
  and,
  type Order,
} from "@workspace/db";
import { requireAuth, requireRole } from "../middleware/auth";
import { notifyTelegramOrderPayment } from "../services/telegram";
import { CreateOrderBody, UpdateOrderStatusBody, UpdateOrderStatusParams, GetOrderParams, ListOrdersQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function buildOrderRow(order: Order, withItems = false) {
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, order.userId));
  const [countRow] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number), itemCount: sql<number>`sum(quantity)`.mapWith(Number) })
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));

  const base = {
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

  if (!withItems) return base;

  const items = await db
    .select({ id: orderItemsTable.id, productId: orderItemsTable.productId, productName: productsTable.name, productImage: productsTable.image, quantity: orderItemsTable.quantity, price: orderItemsTable.price })
    .from(orderItemsTable)
    .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .where(eq(orderItemsTable.orderId, order.id));

  return {
    ...base,
    items: items.map(i => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName ?? "",
      productImage: i.productImage ?? null,
      quantity: i.quantity,
      price: parseFloat(String(i.price)),
      subtotal: parseFloat(String(i.price)) * i.quantity,
    })),
  };
}

router.get("/", requireAuth, async (req, res): Promise<void> => {
  const isStaff = ["staff", "cashier", "admin"].includes(req.user!.role);
  const conditions = isStaff ? [] : [eq(ordersTable.userId, req.user!.userId)];
  if (req.query.status) {
    conditions.push(eq(ordersTable.status, req.query.status as Order["status"]));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db.select().from(ordersTable).where(where).orderBy(desc(ordersTable.createdAt)).limit(50);
  const result = await Promise.all(rows.map(o => buildOrderRow(o)));
  res.json(result);
});

router.post("/", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [cart] = await db.select().from(cartsTable).where(eq(cartsTable.userId, req.user!.userId));
  if (!cart) { res.status(400).json({ error: "Cart is empty" }); return; }

  const cartItems = await db
    .select({ id: cartItemsTable.id, productId: cartItemsTable.productId, quantity: cartItemsTable.quantity, price: cartItemsTable.price })
    .from(cartItemsTable)
    .where(eq(cartItemsTable.cartId, cart.id));

  if (cartItems.length === 0) { res.status(400).json({ error: "Cart is empty" }); return; }

  const subtotal = cartItems.reduce((sum, i) => sum + parseFloat(String(i.price)) * i.quantity, 0);

  let discount = 0;

  const posDiscountMatch = parsed.data.note?.match(/^POS_DISCOUNT:(\d+)/);
  if (posDiscountMatch) {
    const pct = Number(posDiscountMatch[1]);
    discount = subtotal * (pct / 100);
  }

  if (!posDiscountMatch && parsed.data.couponCode) {
    const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, parsed.data.couponCode.toUpperCase()));
    if (coupon && coupon.isActive && (coupon.maxUses === null || coupon.usedCount < coupon.maxUses)) {
      const value = parseFloat(String(coupon.value));
      if (coupon.type === "percent") discount = subtotal * (value / 100);
      else if (coupon.type === "flat") discount = Math.min(value, subtotal);
      await db.update(couponsTable).set({ usedCount: coupon.usedCount + 1 }).where(eq(couponsTable.id, coupon.id));
    }
  }

  const total = subtotal - discount;

  const simulatedPaymentStatus: "pending" | "paid" = parsed.data.paymentMethod === "cash" ? "pending" : "paid";

  const [inserted] = await db
    .insert(ordersTable)
    .values({
      userId: req.user!.userId,
      status: "pending",
      subtotal: String(subtotal),
      discount: String(discount),
      total: String(total),
      paymentMethod: parsed.data.paymentMethod,
      paymentStatus: simulatedPaymentStatus,
      shippingAddress: parsed.data.shippingAddress,
      note: parsed.data.note ?? null,
    })
    .$returningId();
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, inserted.id));

  await db.insert(orderItemsTable).values(cartItems.map(i => ({
    orderId: order.id,
    productId: i.productId,
    quantity: i.quantity,
    price: i.price,
  })));

  for (const item of cartItems) {
  await db
    .update(productsTable)
    .set({
      soldCount: sql`sold_count + ${item.quantity}`,
      stock: sql`stock - ${item.quantity}`,
    })
    .where(eq(productsTable.id, item.productId));
  }

  await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));

  const orderResponse = await buildOrderRow(order);

  const isPosOrder = parsed.data.shippingAddress?.startsWith("POS") ?? false;
  const posCustomerName = isPosOrder ? parsed.data.shippingAddress.replace(/^POS\s*[—-]\s*/, "") : null;

  void notifyTelegramOrderPayment({
    orderId: order.id,
    source: isPosOrder ? "POS" : "Online Checkout",
    customerName: isPosOrder ? posCustomerName : orderResponse.customerName,
    cashierName: isPosOrder ? orderResponse.customerName : null,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: orderResponse.subtotal,
    discount: orderResponse.discount,
    total: orderResponse.total,
    shippingAddress: order.shippingAddress,
    itemCount: orderResponse.itemCount,
    createdAt: order.createdAt,
  });

  res.status(201).json(orderResponse);
});

router.get("/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const isOwner = order.userId === req.user!.userId;
  const isStaff = ["staff", "cashier", "admin"].includes(req.user!.role);
  if (!isOwner && !isStaff) { res.status(403).json({ error: "Forbidden" }); return; }

  res.json(await buildOrderRow(order, true));
});

router.put("/:id/status", requireAuth, requireRole("cashier", "staff", "admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, id));
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  res.json(await buildOrderRow(order));
});

export default router;