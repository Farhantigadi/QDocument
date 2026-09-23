import type { VercelRequest, VercelResponse } from "@vercel/node";
export const dynamic = "force-dynamic";
import { eq, and } from "drizzle-orm";
import { db, schema } from "../../lib/db";
import { verifySession, parseCookie } from "../../lib/session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = parseCookie(req.headers.cookie, "haven_session");
  const session = token ? await verifySession(token) : null;
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const documentId = typeof req.query.documentId === "string" ? req.query.documentId : "";
  const [doc] = await db.select().from(schema.documentsTable)
    .where(and(eq(schema.documentsTable.id, documentId), eq(schema.documentsTable.userId, session.sub)))
    .limit(1);

  if (!doc || doc.status === "deleted") return res.status(404).json({ error: "Document not found" });

  if (req.method === "GET") {
    await db.insert(schema.activityTable).values({ id: crypto.randomUUID(), userId: session.sub, action: "viewed", label: `${doc.title} viewed`, createdAt: new Date() });
    return res.json({ ...doc, sourceType: "link" });
  }

  if (req.method === "PATCH") {
    const body = req.body as Record<string, unknown>;
    const updates: Partial<typeof schema.documentsTable.$inferInsert> = { updatedAt: new Date() };
    if (body.title) updates.title = String(body.title);
    if (body.category) updates.category = String(body.category);
    if (body.notes !== undefined) updates.notes = String(body.notes);
    if (Array.isArray(body.tags)) updates.tags = body.tags.join(",");
    if (body.sourceUrl !== undefined) updates.sourceUrl = String(body.sourceUrl);

    await db.update(schema.documentsTable).set(updates).where(eq(schema.documentsTable.id, documentId));
    await db.insert(schema.activityTable).values({ id: crypto.randomUUID(), userId: session.sub, action: "updated", label: `${doc.title} updated`, createdAt: new Date() });
    return res.json({ ...doc, ...updates, sourceType: "link" });
  }

  if (req.method === "DELETE") {
    await db.update(schema.documentsTable).set({ status: "deleted", updatedAt: new Date() }).where(eq(schema.documentsTable.id, documentId));
    await db.insert(schema.activityTable).values({ id: crypto.randomUUID(), userId: session.sub, action: "deleted", label: `${doc.title} removed`, createdAt: new Date() });
    return res.status(204).end();
  }

  res.status(405).end();
}
