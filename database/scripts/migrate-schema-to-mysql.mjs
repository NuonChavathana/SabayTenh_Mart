import fs from "node:fs";
import path from "node:path";

const schemaDir = path.resolve(import.meta.dirname, "../schema");
const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith(".ts") && f !== "index.ts");

for (const file of files) {
  const filePath = path.join(schemaDir, file);
  let content = fs.readFileSync(filePath, "utf-8");

  content = content.replace(
    /import \{ sqliteTable, text, integer \} from "drizzle-orm\/sqlite-core";/,
    'import { mysqlTable, varchar, int, timestamp, boolean, text } from "drizzle-orm/mysql-core";',
  );
  content = content.replace(/sqliteTable\(/g, "mysqlTable(");
  content = content.replace(
    /integer\(([^,]+),\s*\{\s*mode:\s*"boolean"\s*\}\)/g,
    "boolean($1)",
  );
  content = content.replace(
    /integer\(([^,]+),\s*\{\s*mode:\s*"timestamp"\s*\}\)/g,
    'timestamp($1, { mode: "date" })',
  );
  content = content.replace(
    /\.primaryKey\(\{\s*autoIncrement:\s*true\s*\}\)/g,
    ".autoincrement().primaryKey()",
  );
  content = content.replace(/\binteger\(/g, "int(");
  content = content.replace(/text\(([^,]+),\s*\{\s*enum:/g, "varchar($1, { length: 255, enum:");
  content = content.replace(/\btext\(([^)]+)\)/g, "varchar($1, { length: 255 })");
  content = content.replace(/sql`\(unixepoch\(\)\)`/g, "sql`CURRENT_TIMESTAMP`");

  fs.writeFileSync(filePath, content, "utf-8");
}

console.log("Schema migrated to MySQL.");
