import { Router, type IRouter } from "express";
import { db, couponsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { ValidateCouponBody, CreateCouponBody, UpdateCouponBody, UpdateCouponParams, DeleteCouponParams } from "@workspace/api-zod";

const router: IRouter = Router();

function formatCoupon(c: typeof couponsTable.$inferSelect) {
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    value: parseFloat(String(c.value)),
    minOrder: parseFloat(String(c.minOrder)),
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    isActive: c.isActive,
    expiresAt: c.expiresAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

router.post("/coupons/validate", requireAuth, async (req, res): Promise<void> => {
  const parsed = ValidateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { code, orderAmount = 0 } = parsed.data;
  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code.toUpperCase()));

  if (!coupon || !coupon.isActive) {
    res.status(404).json({ valid: false, message: "Invalid or inactive coupon code." });
    return;
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    res.status(400).json({ valid: false, message: "This coupon has expired." });
    return;
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    res.status(400).json({ valid: false, message: "This coupon has reached its usage limit." });
    return;
  }

  const minOrder = parseFloat(String(coupon.minOrder));
  if (orderAmount < minOrder) {
    res.status(400).json({ valid: false, message: `Minimum order of $${minOrder.toFixed(2)} required.` });
    return;
  }

  const value = parseFloat(String(coupon.value));
  let discountAmount = 0;
  if (coupon.type === "percent") discountAmount = orderAmount * (value / 100);
  else if (coupon.type === "flat") discountAmount = Math.min(value, orderAmount);

  res.json({ valid: true, coupon: formatCoupon(coupon), discountAmount });
});

router.get("/coupons", requireAuth, requireRole("staff", "admin"), async (_req, res): Promise<void> => {
  const rows = await db.select().from(couponsTable).orderBy(couponsTable.id);
  res.json(rows.map(formatCoupon));
});

router.post("/coupons", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const d = parsed.data;
  const [coupon] = await db.insert(couponsTable).values({
    code: d.code.toUpperCase(),
    type: d.type,
    value: String(d.value ?? 0),
    minOrder: String(d.minOrder ?? 0),
    maxUses: d.maxUses ?? null,
    isActive: d.isActive ?? true,
    expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
  }).returning();

  res.status(201).json(formatCoupon(coupon));
});

router.patch("/coupons/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateCouponParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const d = parsed.data;
  const updates: Partial<typeof couponsTable.$inferInsert> = {};
  if (d.code !== undefined) updates.code = d.code.toUpperCase();
  if (d.type !== undefined) updates.type = d.type;
  if (d.value !== undefined) updates.value = String(d.value);
  if (d.minOrder !== undefined) updates.minOrder = String(d.minOrder);
  if (d.maxUses !== undefined) updates.maxUses = d.maxUses ?? null;
  if (d.isActive !== undefined) updates.isActive = d.isActive;
  if (d.expiresAt !== undefined) updates.expiresAt = d.expiresAt ? new Date(d.expiresAt) : null;

  const [coupon] = await db.update(couponsTable).set(updates).where(eq(couponsTable.id, params.data.id)).returning();
  if (!coupon) { res.status(404).json({ error: "Coupon not found" }); return; }

  res.json(formatCoupon(coupon));
});

router.delete("/coupons/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = DeleteCouponParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(couponsTable).where(eq(couponsTable.id, params.data.id));
  res.status(204).send();
});

export default router;
