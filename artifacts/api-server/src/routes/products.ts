import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable, brandsTable, reviewsTable } from "@workspace/db";
import { eq, and, gte, lte, desc, asc, sql, ilike, avg } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { CreateProductBody, UpdateProductBody, GetProductParams, UpdateProductParams, DeleteProductParams, ListProductsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function buildProductRow(p: any, catName: string | null, brandName: string | null, rating: number | null, reviewCount: number) {
  return {
    id: p.id,
    name: p.name,
    nameKh: p.nameKh,
    description: p.description,
    price: parseFloat(p.price),
    originalPrice: p.originalPrice ? parseFloat(p.originalPrice) : null,
    discountPercent: p.discountPercent,
    image: p.image,
    categoryId: p.categoryId,
    categoryName: catName,
    brandId: p.brandId,
    brandName: brandName,
    stock: p.stock,
    rating: rating,
    reviewCount,
    isFeatured: p.isFeatured,
    tags: p.tags,
  };
}

router.get("/products/featured", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      product: productsTable,
      categoryName: categoriesTable.name,
      brandName: brandsTable.name,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .leftJoin(brandsTable, eq(productsTable.brandId, brandsTable.id))
    .where(eq(productsTable.isFeatured, true))
    .limit(12);

  const result = await Promise.all(rows.map(async (r) => {
    const [ratingRow] = await db
      .select({ avg: sql<number>`avg(rating)`.mapWith(Number), count: sql<number>`count(*)`.mapWith(Number) })
      .from(reviewsTable)
      .where(eq(reviewsTable.productId, r.product.id));
    return buildProductRow(r.product, r.categoryName ?? null, r.brandName ?? null, ratingRow?.avg ?? null, ratingRow?.count ?? 0);
  }));
  res.json(result);
});

router.get("/products/best-sellers", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      product: productsTable,
      categoryName: categoriesTable.name,
      brandName: brandsTable.name,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .leftJoin(brandsTable, eq(productsTable.brandId, brandsTable.id))
    .orderBy(desc(productsTable.soldCount))
    .limit(12);

  const result = await Promise.all(rows.map(async (r) => {
    const [ratingRow] = await db
      .select({ avg: sql<number>`avg(rating)`.mapWith(Number), count: sql<number>`count(*)`.mapWith(Number) })
      .from(reviewsTable)
      .where(eq(reviewsTable.productId, r.product.id));
    return buildProductRow(r.product, r.categoryName ?? null, r.brandName ?? null, ratingRow?.avg ?? null, ratingRow?.count ?? 0);
  }));
  res.json(result);
});

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { search, categoryId, brandId, minPrice, maxPrice, page = 1, limit = 20, sort } = params.data;

  const conditions = [];
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
  if (brandId) conditions.push(eq(productsTable.brandId, brandId));
  if (minPrice) conditions.push(gte(sql`${productsTable.price}::numeric`, minPrice));
  if (maxPrice) conditions.push(lte(sql`${productsTable.price}::numeric`, maxPrice));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const orderBy = sort === "price_asc" ? asc(productsTable.price)
    : sort === "price_desc" ? desc(productsTable.price)
    : sort === "newest" ? desc(productsTable.createdAt)
    : sort === "best_selling" ? desc(productsTable.soldCount)
    : desc(productsTable.createdAt);

  const offset = (page - 1) * limit;

  const [totalRow] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(productsTable).where(where);
  const rows = await db
    .select({ product: productsTable, categoryName: categoriesTable.name, brandName: brandsTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .leftJoin(brandsTable, eq(productsTable.brandId, brandsTable.id))
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  const products = await Promise.all(rows.map(async (r) => {
    const [ratingRow] = await db
      .select({ avg: sql<number>`avg(rating)`.mapWith(Number), count: sql<number>`count(*)`.mapWith(Number) })
      .from(reviewsTable)
      .where(eq(reviewsTable.productId, r.product.id));
    return buildProductRow(r.product, r.categoryName ?? null, r.brandName ?? null, ratingRow?.avg ?? null, ratingRow?.count ?? 0);
  }));

  res.json({ products, total: totalRow?.count ?? 0, page, limit });
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db
    .select({ product: productsTable, categoryName: categoriesTable.name, brandName: brandsTable.name })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .leftJoin(brandsTable, eq(productsTable.brandId, brandsTable.id))
    .where(eq(productsTable.id, id));

  if (!row) { res.status(404).json({ error: "Product not found" }); return; }

  const reviews = await db
    .select({ id: reviewsTable.id, productId: reviewsTable.productId, userId: reviewsTable.userId, userName: sql<string>`(select name from users where id = ${reviewsTable.userId})`, rating: reviewsTable.rating, comment: reviewsTable.comment, createdAt: reviewsTable.createdAt })
    .from(reviewsTable)
    .where(eq(reviewsTable.productId, id));

  const rating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  res.json({
    ...buildProductRow(row.product, row.categoryName ?? null, row.brandName ?? null, rating, reviews.length),
    images: row.product.image ? [row.product.image] : [],
    reviews: reviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
  });
});

router.post("/products", requireAuth, requireRole("staff", "admin"), async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [product] = await db.insert(productsTable).values({
    ...parsed.data,
    price: String(parsed.data.price),
    originalPrice: parsed.data.originalPrice ? String(parsed.data.originalPrice) : null,
  }).returning();
  res.status(201).json(buildProductRow(product, null, null, null, 0));
});

router.put("/products/:id", requireAuth, requireRole("staff", "admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [product] = await db.update(productsTable).set({
    ...parsed.data,
    price: parsed.data.price ? String(parsed.data.price) : undefined,
    originalPrice: parsed.data.originalPrice ? String(parsed.data.originalPrice) : undefined,
  }).where(eq(productsTable.id, id)).returning();
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(buildProductRow(product, null, null, null, 0));
});

router.delete("/products/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.sendStatus(204);
});

export default router;
