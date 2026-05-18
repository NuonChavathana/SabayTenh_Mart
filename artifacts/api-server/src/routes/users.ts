import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { UpdateUserRoleBody, UpdateUserRoleParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const rows = await db.select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, phone: usersTable.phone, role: usersTable.role, createdAt: usersTable.createdAt }).from(usersTable);
  res.json(rows.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

router.put("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateUserRoleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.update(usersTable).set({ role: parsed.data.role }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role, createdAt: user.createdAt.toISOString() });
});

export default router;
