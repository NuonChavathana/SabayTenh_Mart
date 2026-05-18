import { Router, type IRouter } from "express";
import { db, reviewsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateReviewBody, CreateReviewParams, ListProductReviewsParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products/:id/reviews", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const productId = parseInt(raw, 10);
  if (isNaN(productId)) { res.status(400).json({ error: "Invalid id" }); return; }
  const rows = await db
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
    .where(eq(reviewsTable.productId, productId));
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/products/:id/reviews", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const productId = parseInt(raw, 10);
  if (isNaN(productId)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [review] = await db.insert(reviewsTable).values({
    productId,
    userId: req.user!.userId,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  }).returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, review.userId));
  res.status(201).json({ ...review, userName: user?.name ?? null, createdAt: review.createdAt.toISOString() });
});

export default router;
