import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable, inventoryLogsTable } from "@workspace/db";
import { eq, lte, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { UpdateInventoryBody, UpdateInventoryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/inventory", requireAuth, requireRole("staff", "cashier", "admin"), async (req, res): Promise<void> => {
  const lowStockOnly = req.query.lowStock === "true";
  const rows = await db
    .select({ product: productsTable, categoryName: categoriesTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(lowStockOnly ? lte(productsTable.stock, productsTable.lowStockThreshold) : undefined)
    .orderBy(productsTable.name);

  res.json(rows.map(r => ({
    productId: r.product.id,
    productName: r.product.name,
    categoryName: r.categoryName ?? null,
    stock: r.product.stock,
    lowStockThreshold: r.product.lowStockThreshold,
    isLowStock: r.product.stock <= r.product.lowStockThreshold,
    price: parseFloat(String(r.product.price)),
  })));
});

router.put("/inventory/:productId", requireAuth, requireRole("staff", "admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const productId = parseInt(raw, 10);
  if (isNaN(productId)) { res.status(400).json({ error: "Invalid productId" }); return; }

  const parsed = UpdateInventoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [before] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!before) { res.status(404).json({ error: "Product not found" }); return; }

  const updates: any = { stock: parsed.data.stock };
  if (parsed.data.lowStockThreshold !== undefined) updates.lowStockThreshold = parsed.data.lowStockThreshold;

  const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, productId)).returning();

  await db.insert(inventoryLogsTable).values({
    productId,
    userId: req.user!.userId,
    change: parsed.data.stock - before.stock,
    reason: "manual_adjustment",
  });

  const [catRow] = await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));

  res.json({
    productId: product.id,
    productName: product.name,
    categoryName: catRow?.name ?? null,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    isLowStock: product.stock <= product.lowStockThreshold,
    price: parseFloat(String(product.price)),
  });
});

export default router;
