import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../../lib/db/src/schema/index";

// Supabase pooled connection (port 6543) — stateless, safe for serverless
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "Missing configuration: DATABASE_URL is not set.\n" +
      "For Supabase serverless pooling use a connection like:\n" +
      "postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:6543/postgres?sslmode=require\n",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  // Keep max=1 to be safe in serverless environments. If you use connection pooling
  // at a higher level (e.g. Supabase pooler), you can increase this conservatively.
  max: Number(process.env.PG_MAX_CLIENTS ?? 1),
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });
export { schema };
