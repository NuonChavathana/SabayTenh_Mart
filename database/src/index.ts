import { createPool } from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = createPool({ uri: databaseUrl });
export const db = drizzle(pool, { mode: "default", schema });

export {
  eq,
  and,
  or,
  desc,
  asc,
  sql,
  gte,
  lte,
  count,
  avg,
} from "drizzle-orm";

export * from "../schema";
