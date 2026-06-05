import { Router, type IRouter } from "express";
import { db, reviewsTable, usersTable, eq, and, sql } from "@workspace/db";
import { requireAuth } from "../middleware/auth";
import { CreateReviewBody } from "@workspace/api-zod";

const router: IRouter = Router();

const getMyReviews = async (req: any, res: any): Promise<void> => {
  try {
    const rows = await db
      .select({
        id: reviewsTable.id,
        productId: reviewsTable.productId,
        userId: reviewsTable.userId,
        rating: reviewsTable.rating,
        comment: reviewsTable.comment,
        createdAt: reviewsTable.createdAt,
      })
      .from(reviewsTable)
      .where(eq(reviewsTable.userId, req.user!.userId));

    res.json(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    res.status(500).json({
      message: "Failed to get reviews",
    });
  }
};

const getMyReviewsCount = async (req: any, res: any): Promise<void> => {
  try {
    const rows = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(reviewsTable)
      .where(eq(reviewsTable.userId, req.user!.userId));

    res.json({
      count: Number(rows[0]?.count ?? 0),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get reviews count",
    });
  }
};

// Final URLs if mounted in index.ts as: router.use("/reviews", reviewRoutes)
// GET /api/reviews/my
// GET /api/reviews/my/count
// GET /api/reviews/products/:id/reviews
// POST /api/reviews/products/:id/reviews

router.get("/my", requireAuth, getMyReviews);
router.get("/my/count", requireAuth, getMyReviewsCount);

router.get("/:id/reviews", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const productId = parseInt(raw, 10);

    if (Number.isNaN(productId)) {
      res.status(400).json({ error: "Invalid product id" });
      return;
    }

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

    res.json(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    res.status(500).json({
      message: "Failed to get product reviews",
    });
  }
});

router.post("/:id/reviews", requireAuth, async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const productId = parseInt(raw, 10);

    if (Number.isNaN(productId)) {
      res.status(400).json({ error: "Invalid product id" });
      return;
    }

    const parsed = CreateReviewBody.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existingReview] = await db
      .select()
      .from(reviewsTable)
      .where(
        and(
          eq(reviewsTable.productId, productId),
          eq(reviewsTable.userId, req.user!.userId)
        )
      );

    if (existingReview) {
      res.status(409).json({
        message: "You already reviewed this product",
      });
      return;
    }

    const [inserted] = await db
      .insert(reviewsTable)
      .values({
        productId,
        userId: req.user!.userId,
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
      })
      .$returningId();

    const [review] = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, inserted.id));

    if (!review) {
      res.status(500).json({
        message: "Review was not created",
      });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, review.userId));

    res.status(201).json({
      ...review,
      userName: user?.name ?? null,
      createdAt: review.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create review",
    });
  }
});

export default router;