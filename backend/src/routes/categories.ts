import { Router, type IRouter } from "express";
import { db, categoriesTable, productsTable, eq, sql } from "@workspace/db";

const router: IRouter = Router();

router.get("/", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      nameKh: categoriesTable.nameKh,
      slug: categoriesTable.slug,
      icon: categoriesTable.icon,
      productCount: sql<number>`(select count(*) from products where products.category_id = ${categoriesTable.id})`.mapWith(Number),
    })
    .from(categoriesTable)
    .orderBy(categoriesTable.sortOrder);
  res.json(rows);
});

export default router;
