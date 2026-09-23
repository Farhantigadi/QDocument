import type { VercelRequest, VercelResponse } from "@vercel/node";
export const dynamic = "force-dynamic";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { signSession, cookieHeader, resolveRole } from "../lib/session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { name, email, password } = req.body as Record<string, string>;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db.select().from(schema.usersTable).where(eq(schema.usersTable.email, normalizedEmail)).limit(1);
  if (existing.length > 0) return res.status(409).json({ error: "An account with this email already exists." });

  const passwordHash = await bcrypt.hash(password, 10);
  const role = resolveRole(normalizedEmail);
  const id = crypto.randomUUID();

  await db.insert(schema.usersTable).values({ id, name: name.trim(), email: normalizedEmail, passwordHash, role });

  const token = await signSession({ sub: id, name: name.trim(), email: normalizedEmail, role });
  res.setHeader("Set-Cookie", cookieHeader(token));
  res.status(201).json({ id, name: name.trim(), email: normalizedEmail, role });
}
