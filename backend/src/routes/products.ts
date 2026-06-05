import { Router, type IRouter } from "express";
import { uploadProductImage } from "../middleware/upload";
import {
  db,
  productsTable,
  categoriesTable,
  brandsTable,
  reviewsTable,
  eq,
  and,
  desc,
  asc,
  sql,
  type Product,
} from "@workspace/db";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  CreateProductBody,
  UpdateProductBody,
  ListProductsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildProductRow(
  p: Product,
  catName: string | null,
  brandName: string | null,
  rating: number | null,
  reviewCount: number,
) {
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
    brandName,
    stock: p.stock,
    soldCount: p.soldCount,
    rating,
    reviewCount,
    isFeatured: p.isFeatured,
    tags: p.tags,
  };
}

router.get("/featured", async (_req, res): Promise<void> => {
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

  const result = await Promise.all(
    rows.map(async (r) => {
      const [ratingRow] = await db
        .select({
          avg: sql<number>`avg(rating)`.mapWith(Number),
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(reviewsTable)
        .where(eq(reviewsTable.productId, r.product.id));

      return buildProductRow(
        r.product,
        r.categoryName ?? null,
        r.brandName ?? null,
        ratingRow?.avg ?? null,
        ratingRow?.count ?? 0,
      );
    }),
  );

  res.json(result);
});

router.get("/best-sellers", async (_req, res): Promise<void> => {
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

  const result = await Promise.all(
    rows.map(async (r) => {
      const [ratingRow] = await db
        .select({
          avg: sql<number>`avg(rating)`.mapWith(Number),
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(reviewsTable)
        .where(eq(reviewsTable.productId, r.product.id));

      return buildProductRow(
        r.product,
        r.categoryName ?? null,
        r.brandName ?? null,
        ratingRow?.avg ?? null,
        ratingRow?.count ?? 0,
      );
    }),
  );

  res.json(result);
});

router.get("/", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const {
    search,
    categoryId,
    brandId,
    minPrice,
    maxPrice,
    page = 1,
    limit = 20,
    sort,
  } = params.data;

  const conditions = [];

  const priceNumber = sql<number>`CAST(${productsTable.price} AS DECIMAL(10, 2))`;

  if (search) {
    conditions.push(
      sql`LOWER(${productsTable.name}) LIKE LOWER(${`%${search}%`})`,
    );
  }

  if (categoryId) {
    conditions.push(eq(productsTable.categoryId, categoryId));
  }

  if (brandId) {
    conditions.push(eq(productsTable.brandId, brandId));
  }

  if (minPrice !== undefined) {
    conditions.push(sql`${priceNumber} >= ${minPrice}`);
  }

  if (maxPrice !== undefined) {
    conditions.push(sql`${priceNumber} <= ${maxPrice}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const orderBy =
    sort === "price_asc"
      ? asc(priceNumber)
      : sort === "price_desc"
        ? desc(priceNumber)
        : sort === "newest"
          ? desc(productsTable.createdAt)
          : sort === "best_selling"
            ? desc(productsTable.soldCount)
            : desc(productsTable.createdAt);

  const offset = (page - 1) * limit;

  const [totalRow] = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(productsTable)
    .where(where);

  const rows = await db
    .select({
      product: productsTable,
      categoryName: categoriesTable.name,
      brandName: brandsTable.name,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .leftJoin(brandsTable, eq(productsTable.brandId, brandsTable.id))
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  const products = await Promise.all(
    rows.map(async (r) => {
      const [ratingRow] = await db
        .select({
          avg: sql<number>`avg(rating)`.mapWith(Number),
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(reviewsTable)
        .where(eq(reviewsTable.productId, r.product.id));

      return buildProductRow(
        r.product,
        r.categoryName ?? null,
        r.brandName ?? null,
        ratingRow?.avg ?? null,
        ratingRow?.count ?? 0,
      );
    }),
  );

  res.json({
    products,
    total: totalRow?.count ?? 0,
    page,
    limit,
  });
});

router.post("/upload-image", requireAuth, requireRole("staff", "admin"), uploadProductImage.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image uploaded",
      });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;

    return res.json({
      imageUrl,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to upload image",
    });
  }
});

router.get("/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select({
      product: productsTable,
      categoryName: categoriesTable.name,
      brandName: brandsTable.name,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .leftJoin(brandsTable, eq(productsTable.brandId, brandsTable.id))
    .where(eq(productsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const reviews = await db
    .select({
      id: reviewsTable.id,
      productId: reviewsTable.productId,
      userId: reviewsTable.userId,
      userName: sql<string>`(select name from users where id = ${reviewsTable.userId})`,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      createdAt: reviewsTable.createdAt,
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.productId, id));

  const rating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;

  res.json({
    ...buildProductRow(
      row.product,
      row.categoryName ?? null,
      row.brandName ?? null,
      rating,
      reviews.length,
    ),
    images: row.product.image ? [row.product.image] : [],
    reviews: reviews.map((review) => ({
      ...review,
      createdAt: review.createdAt.toISOString(),
    })),
  });
});

router.post(
  "/",
  requireAuth,
  requireRole("staff", "admin"),
  async (req, res): Promise<void> => {
    const parsed = CreateProductBody.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [inserted] = await db
      .insert(productsTable)
      .values({
        ...parsed.data,
        price: String(parsed.data.price),
        originalPrice: parsed.data.originalPrice
          ? String(parsed.data.originalPrice)
          : null,
      })
      .$returningId();

    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, inserted.id));

    res.status(201).json(buildProductRow(product, null, null, null, 0));
  },
);

router.put(
  "/:id",
  requireAuth,
  requireRole("staff", "admin"),
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const parsed = UpdateProductBody.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    await db
      .update(productsTable)
      .set({
        ...parsed.data,
        price:
          parsed.data.price !== undefined ? String(parsed.data.price) : undefined,
        originalPrice:
          parsed.data.originalPrice !== undefined
            ? String(parsed.data.originalPrice)
            : undefined,
      })
      .where(eq(productsTable.id, id));

    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, id));

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json(buildProductRow(product, null, null, null, 0));
  },
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    await db.delete(productsTable).where(eq(productsTable.id, id));

    res.sendStatus(204);
  },
);

export default router;