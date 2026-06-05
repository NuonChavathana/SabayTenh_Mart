import { sql } from "drizzle-orm";
import { mysqlTable, varchar, int, timestamp, boolean, text } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inventoryLogsTable = mysqlTable("inventory_logs", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("product_id").notNull(),
  userId: int("user_id"),
  change: int("change").notNull(),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const insertInventoryLogSchema = createInsertSchema(
  inventoryLogsTable,
).omit({ id: true, createdAt: true });
export type InsertInventoryLog = z.infer<typeof insertInventoryLogSchema>;
export type InventoryLog = typeof inventoryLogsTable.$inferSelect;
