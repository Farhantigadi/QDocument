import type { VercelRequest, VercelResponse } from "@vercel/node";
export const dynamic = "force-dynamic";
import { eq, and } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { verifySession, parseCookie } from "../lib/session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = parseCookie(req.headers.cookie, "haven_session");
  const session = token ? await verifySession(token) : null;
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  if (req.url?.includes("/activity")) {
    const activities = await db.select().from(schema.activityTable)
      .where(eq(schema.activityTable.userId, session.sub))
      .orderBy(schema.activityTable.createdAt)
      .limit(8);
    return res.json(activities.reverse());
  }

  const docs = await db.select().from(schema.documentsTable)
    .where(and(eq(schema.documentsTable.userId, session.sub), eq(schema.documentsTable.status, "active")));

  const categoryMap = new Map<string, number>();
  for (const doc of docs) {
    categoryMap.set(doc.category, (categoryMap.get(doc.category) ?? 0) + 1);
  }

  res.json({
    documentCount: docs.length,
    storageUsedBytes: 0,
    storageLimitBytes: 15 * 1024 * 1024 * 1024,
    categories: [...categoryMap.entries()].map(([category, count]) => ({ category, count })),
  });
}
