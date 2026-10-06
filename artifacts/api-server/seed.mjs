// Run: node --env-file=../../.env.local seed.mjs  (from artifacts/api-server/)
import bcrypt from "bcryptjs";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

const { Pool } = pg;

const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("USER"),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "farhantigadi123@gmail.com";
const ADMIN_NAME = "Farhan";
const ADMIN_PASSWORD = "Ft@haven123";

// Supabase pooler: parse URL manually to avoid pg misreading the dotted username
const rawUrl = new URL(process.env.DATABASE_URL ?? "");
const pool = new Pool({
  host: rawUrl.hostname,
  port: Number(rawUrl.port) || 6543,
  database: rawUrl.pathname.slice(1),
  user: decodeURIComponent(rawUrl.username),
  password: decodeURIComponent(rawUrl.password),
  ssl: { rejectUnauthorized: false },
});
const db = drizzle(pool);

const [existing] = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.email, ADMIN_EMAIL))
  .limit(1);

if (existing) {
  console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
} else {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await db.insert(usersTable).values({
    id: crypto.randomUUID(),
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash,
    role: "ADMIN",
    emailVerified: true,
  });
  console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
}

await pool.end();
