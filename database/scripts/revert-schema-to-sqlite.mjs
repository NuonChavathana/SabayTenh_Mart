import fs from "node:fs";
import path from "node:path";

const schemaDir = path.resolve(import.meta.dirname, "../schema");
const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith(".ts"));

for (const file of files) {
  const filePath = path.join(schemaDir, file);
  let content = fs.readFileSync(filePath, "utf-8");

  content = content.replace(
    /import \{ mysqlTable[^\}]*\} from "drizzle-orm\/mysql-core";/,
    'import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";',
  );
  content = content.replace(/mysqlTable\(/g, "sqliteTable(");
  content = content.replace(/\bint\(/g, "integer(");
  content = content.replace(
    /varchar\(([^,]+),\s*\{\s*length:\s*255,\s*enum:/g,
    "text($1, { enum:",
  );
  content = content.replace(/varchar\(([^,]+),\s*\{\s*length:\s*255\s*\}\)/g, "text($1)");
  content = content.replace(
    /timestamp\(([^,]+),\s*\{\s*mode:\s*"date"\s*\}\)/g,
    'integer($1, { mode: "timestamp" })',
  );
  content = content.replace(/sql`CURRENT_TIMESTAMP`/g, "sql`(unixepoch())`");

  fs.writeFileSync(filePath, content, "utf-8");
}

console.log("Schema reverted to SQLite.");
