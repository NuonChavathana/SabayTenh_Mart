import { Router, type IRouter } from "express";
import { db, wishlistsTable, productsTable, categoriesTable, brandsTable, reviewsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select({ product: productsTable, categoryName: categoriesTable.name, brandName: brandsTable.name })
    .from(wishlistsTable)
    .innerJoin(productsTable, eq(wishlistsTable.productId, productsTable.id))
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .leftJoin(brandsTable, eq(productsTable.brandId, brandsTable.id))
    .where(eq(wishlistsTable.userId, req.user!.userId));

  const result = await Promise.all(rows.map(async (r) => {
    const [ratingRow] = await db
      .select({ avg: sql<number>`avg(rating)`.mapWith(Number), count: sql<number>`count(*)`.mapWith(Number) })
      .from(reviewsTable)
      .where(eq(reviewsTable.productId, r.product.id));
    return {
      id: r.product.id,
      name: r.product.name,
      nameKh: r.product.nameKh,
      description: r.product.description,
      price: parseFloat(String(r.product.price)),
      originalPrice: r.product.originalPrice ? parseFloat(String(r.product.originalPrice)) : null,
      discountPercent: r.product.discountPercent,
      image: r.product.image,
      categoryId: r.product.categoryId,
      categoryName: r.categoryName ?? null,
      brandId: r.product.brandId,
      brandName: r.brandName ?? null,
      stock: r.product.stock,
      rating: ratingRow?.avg ?? null,
      reviewCount: ratingRow?.count ?? 0,
      isFeatured: r.product.isFeatured,
      tags: r.product.tags,
    };
  }));
  res.json(result);
});

router.post("/wishlist/:productId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const productId = parseInt(raw, 10);
  if (isNaN(productId)) { res.status(400).json({ error: "Invalid productId" }); return; }
  const existing = await db.select().from(wishlistsTable).where(and(eq(wishlistsTable.userId, req.user!.userId), eq(wishlistsTable.productId, productId)));
  if (existing.length === 0) {
    await db.insert(wishlistsTable).values({ userId: req.user!.userId, productId });
  }
  res.json({ ok: true });
});

router.delete("/wishlist/:productId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const productId = parseInt(raw, 10);
  if (isNaN(productId)) { res.status(400).json({ error: "Invalid productId" }); return; }
  await db.delete(wishlistsTable).where(and(eq(wishlistsTable.userId, req.user!.userId), eq(wishlistsTable.productId, productId)));
  res.json({ ok: true });
});

export default router;
