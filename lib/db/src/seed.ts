import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "./index.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "farhantigadi123@gmail.com";
const ADMIN_NAME = "Farhan";
const ADMIN_PASSWORD = "Ft@haven123";

async function seed() {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, ADMIN_EMAIL))
    .limit(1);

  if (existing) {
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
    process.exit(0);
  }

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
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
