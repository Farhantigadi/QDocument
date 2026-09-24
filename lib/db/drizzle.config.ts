import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Missing configuration: DATABASE_URL is not set.\n" +
      "For Supabase serverless pooling use a connection like:\n" +
      "postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:6543/postgres?sslmode=require\n",
  );
}

// Ensure pooling-friendly minimal connections in serverless environments
export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
