import fs from 'node:fs';
import path from 'node:path';

const schemaDir = path.resolve(import.meta.dirname, '../schema');
const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(schemaDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace imports
  content = content.replace(
    /import \{ sqliteTable([^\}]*)\} from "drizzle-orm\/sqlite-core";/,
    'import { mysqlTable, varchar, int, timestamp, text, boolean, decimal, json } from "drizzle-orm/mysql-core";'
  );
  
  // Replace sqliteTable with mysqlTable
  content = content.replace(/sqliteTable\(/g, 'mysqlTable(');

  // Replace column types
  // integer('id').primaryKey(...) -> int('id').primaryKey(...)
  // Note: we'll just replace \binteger( with int(
  content = content.replace(/\binteger\(/g, 'int(');
  
  // text('role', { enum: [...] }) -> varchar('role', { length: 255, enum: [...] })
  // text('name') -> varchar('name', { length: 255 })
  content = content.replace(/\btext\(([^,)]+)\)/g, 'varchar($1, { length: 255 })');
  content = content.replace(/\btext\(([^,]+),\s*\{/g, 'varchar($1, { length: 255,');

  // mode: "timestamp" -> timestamp
  content = content.replace(/int\(([^,]+),\s*\{\s*mode:\s*"timestamp"\s*\}\)/g, 'timestamp($1, { mode: "date" })');
  
  // sql`(unixepoch())` -> sql`CURRENT_TIMESTAMP`
  content = content.replace(/sql`\(unixepoch\(\)\)`/g, 'sql`CURRENT_TIMESTAMP`');

  fs.writeFileSync(filePath, content, 'utf-8');
}
console.log('Schema files updated.');
