import { Router, type IRouter } from "express";
import { db, cartsTable, cartItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { AddToCartBody, UpdateCartItemBody, UpdateCartItemParams, RemoveCartItemParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateCart(userId: number) {
  let [cart] = await db.select().from(cartsTable).where(eq(cartsTable.userId, userId));
  if (!cart) {
    [cart] = await db.insert(cartsTable).values({ userId }).returning();
  }
  return cart;
}

async function buildCartResponse(cartId: number) {
  const items = await db
    .select({
      id: cartItemsTable.id,
      productId: cartItemsTable.productId,
      productName: productsTable.name,
      productImage: productsTable.image,
      quantity: cartItemsTable.quantity,
      price: cartItemsTable.price,
    })
    .from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.cartId, cartId));

  const cartItems = items.map(item => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName ?? "",
    productImage: item.productImage ?? null,
    quantity: item.quantity,
    price: parseFloat(String(item.price)),
    subtotal: parseFloat(String(item.price)) * item.quantity,
  }));

  const subtotal = cartItems.reduce((sum, i) => sum + i.subtotal, 0);
  const discount = 0;
  const total = subtotal - discount;
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return { id: cartId, items: cartItems, subtotal, discount, total, itemCount };
}

router.get("/cart", requireAuth, async (req, res): Promise<void> => {
  const cart = await getOrCreateCart(req.user!.userId);
  res.json(await buildCartResponse(cart.id));
});

router.post("/cart/items", requireAuth, async (req, res): Promise<void> => {
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { productId, quantity } = parsed.data;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const cart = await getOrCreateCart(req.user!.userId);
  const [existing] = await db.select().from(cartItemsTable).where(and(eq(cartItemsTable.cartId, cart.id), eq(cartItemsTable.productId, productId)));

  if (existing) {
    await db.update(cartItemsTable).set({ quantity: existing.quantity + quantity }).where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({ cartId: cart.id, productId, quantity, price: product.price });
  }

  res.json(await buildCartResponse(cart.id));
});

router.put("/cart/items/:itemId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const itemId = parseInt(raw, 10);
  if (isNaN(itemId)) { res.status(400).json({ error: "Invalid itemId" }); return; }

  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const cart = await getOrCreateCart(req.user!.userId);

  if (parsed.data.quantity <= 0) {
    await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.cartId, cart.id)));
  } else {
    await db.update(cartItemsTable).set({ quantity: parsed.data.quantity }).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.cartId, cart.id)));
  }

  res.json(await buildCartResponse(cart.id));
});

router.delete("/cart/items/:itemId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const itemId = parseInt(raw, 10);
  if (isNaN(itemId)) { res.status(400).json({ error: "Invalid itemId" }); return; }
  const cart = await getOrCreateCart(req.user!.userId);
  await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.cartId, cart.id)));
  res.json(await buildCartResponse(cart.id));
});

router.delete("/cart/clear", requireAuth, async (req, res): Promise<void> => {
  const cart = await getOrCreateCart(req.user!.userId);
  await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
  res.json(await buildCartResponse(cart.id));
});

export default router;
