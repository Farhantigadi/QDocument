import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, count } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { verifySession, parseCookie } from "../lib/session";

export const dynamic = "force-dynamic";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = parseCookie(req.headers.cookie, "haven_session");
  const session = token ? await verifySession(token) : null;
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  if (session.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });

  // POST /api/admin/delegate — toggle user role
  if (req.method === "POST" && req.url?.includes("/delegate")) {
    const { email } = req.body as Record<string, string>;
    if (!email?.trim()) return res.status(400).json({ error: "Email is required." });
    const normalizedEmail = email.trim().toLowerCase();
    const [user] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.email, normalizedEmail)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found." });
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    await db.update(schema.usersTable).set({ role: newRole }).where(eq(schema.usersTable.email, normalizedEmail));
    return res.json({ email: normalizedEmail, role: newRole });
  }

  // GET /api/admin/users
  if (req.url?.includes("/users")) {
    const users = await db.select().from(schema.usersTable);
    const docCounts = await db
      .select({ userId: schema.documentsTable.userId, count: count() })
      .from(schema.documentsTable)
      .where(eq(schema.documentsTable.status, "active"))
      .groupBy(schema.documentsTable.userId);
    const countMap = new Map(docCounts.map((r) => [r.userId, Number(r.count)]));
    return res.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: "ACTIVE",
        documentCount: countMap.get(u.id) ?? 0,
        storageUsedBytes: 0,
        storageLimitBytes: 15 * 1024 * 1024 * 1024,
      }))
    );
  }

  // GET /api/admin/overview
  const [userCount] = await db.select({ count: count() }).from(schema.usersTable);
  const [docCount] = await db.select({ count: count() }).from(schema.documentsTable).where(eq(schema.documentsTable.status, "active"));
  const [actCount] = await db.select({ count: count() }).from(schema.activityTable);
  res.json({
    userCount: Number(userCount.count),
    documentCount: Number(docCount.count),
    storageUsedBytes: 0,
    auditEventCount: Number(actCount.count),
  });
}
