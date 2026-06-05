import { defineConfig } from "drizzle-kit";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");

try {
  process.loadEnvFile(envPath);
} catch {
  // ignore
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  schema: path.join(__dirname, "./schema/index.ts"),
  dialect: "mysql",
  dbCredentials: {
    url: databaseUrl,
  },
});
