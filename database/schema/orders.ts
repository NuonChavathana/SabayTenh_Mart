import { sql } from "drizzle-orm";
import { mysqlTable, varchar, int, timestamp, boolean, text } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  couponId: int("coupon_id"),                              // ← បន្ថែម!
  status: varchar("status", { length: 255, enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
  })
    .notNull()
    .default("pending"),
  subtotal: varchar("subtotal", { length: 255 }).notNull(),
  discount: varchar("discount", { length: 255 }).notNull().default("0"),
  deliveryFee: varchar("delivery_fee", { length: 255 }).notNull().default("0"),  // ← បន្ថែម!
  total: varchar("total", { length: 255 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 255, enum: ["cash", "khqr", "aba", "acleda", "canadia", "wing"],
  }),
  paymentStatus: varchar("payment_status", { length: 255, enum: ["pending", "paid", "failed", "refunded"],
  })
    .notNull()
    .default("pending"),
  shippingAddress: varchar("shipping_address", { length: 255 }),
  note: varchar("note", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const orderItemsTable = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").notNull(),
  productId: int("product_id").notNull(),
  quantity: int("quantity").notNull(),
  price: varchar("price", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;