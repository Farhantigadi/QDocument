import type { VercelRequest, VercelResponse } from "@vercel/node";
export const dynamic = "force-dynamic";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { signSession, cookieHeader } from "../lib/session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password } = req.body as Record<string, string>;
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.email, normalizedEmail)).limit(1);

  if (!user) return res.status(401).json({ error: "Invalid email or password." });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password." });

  const token = await signSession({ sub: user.id, name: user.name, email: user.email, role: user.role });
  res.setHeader("Set-Cookie", cookieHeader(token));
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
}
