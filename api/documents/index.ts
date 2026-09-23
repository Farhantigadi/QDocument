import type { VercelRequest, VercelResponse } from "@vercel/node";
export const dynamic = "force-dynamic";
import { eq, and, ilike, or } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { verifySession, parseCookie } from "../lib/session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = parseCookie(req.headers.cookie, "haven_session");
  const session = token ? await verifySession(token) : null;
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : "";
    const category = typeof req.query.category === "string" ? req.query.category : "";
    const sort = req.query.sort;

    let query = db.select().from(schema.documentsTable)
      .where(and(
        eq(schema.documentsTable.userId, session.sub),
        eq(schema.documentsTable.status, "active"),
        search ? or(ilike(schema.documentsTable.title, `%${search}%`), ilike(schema.documentsTable.category, `%${search}%`)) : undefined,
        category ? eq(schema.documentsTable.category, category) : undefined,
      ));

    const docs = await query;
    const sorted = [...docs].sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return res.json(sorted);
  }

  if (req.method === "POST") {
    const body = req.body as Record<string, unknown>;
    const title = String(body.title ?? "").trim();
    const category = String(body.category ?? "").trim();
    const sourceUrl = body.sourceUrl ? String(body.sourceUrl).trim() : null;
    const tags = Array.isArray(body.tags) ? body.tags.join(",") : String(body.tags ?? "");
    const notes = String(body.notes ?? "").trim();

    if (!title || !category) return res.status(400).json({ error: "Title and category are required." });

    const now = new Date();
    const doc = {
      id: crypto.randomUUID(),
      userId: session.sub,
      title,
      category,
      sourceUrl,
      tags,
      notes,
      status: "active",
      uploadedAt: now,
      updatedAt: now,
    };

    await db.insert(schema.documentsTable).values(doc);
    await db.insert(schema.activityTable).values({ id: crypto.randomUUID(), userId: session.sub, action: "uploaded", label: `${title} added`, createdAt: now });
    return res.status(201).json({ ...doc, sourceType: "link" });
  }

  res.status(405).end();
}
