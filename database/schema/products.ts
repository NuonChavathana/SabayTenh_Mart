import { sql } from "drizzle-orm";
import { mysqlTable, varchar, int, timestamp, boolean, text } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameKh: varchar("name_kh", { length: 255 }),
  description: varchar("description", { length: 255 }),
  price: varchar("price", { length: 255 }).notNull(),
  originalPrice: varchar("original_price", { length: 255 }),
  discountPercent: int("discount_percent"),
  image: varchar("image", { length: 255 }),
  categoryId: int("category_id").notNull(),
  brandId: int("brand_id"),
  stock: int("stock").notNull().default(0),
  lowStockThreshold: int("low_stock_threshold").notNull().default(10),
  isFeatured: boolean("is_featured").notNull().default(false),
  tags: varchar("tags", { length: 255 }),
  soldCount: int("sold_count").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
