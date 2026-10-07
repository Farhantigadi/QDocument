import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// POST /share — create a share link (owner only)
router.post("/share", requireAuth, async (req, res) => {
  const ownerId = req.session!.sub;
  const { documentIds, expiresInDays } = req.body as {
    documentIds: string[];
    expiresInDays?: number;
  };

  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    res.status(400).json({ error: "documentIds must be a non-empty array" });
    return;
  }

  // Verify all docs belong to this user
  const docs = await db
    .select({ id: schema.documentsTable.id })
    .from(schema.documentsTable)
    .where(
      and(
        inArray(schema.documentsTable.id, documentIds),
        eq(schema.documentsTable.userId, ownerId),
        eq(schema.documentsTable.status, "active")
      )
    );

  if (docs.length !== documentIds.length) {
    res.status(403).json({ error: "One or more documents not found or not yours" });
    return;
  }

  const id = crypto.randomUUID();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86_400_000)
    : null;

  await db.insert(schema.shareLinksTable).values({
    id,
    ownerId,
    documentIds: documentIds.join(","),
    expiresAt,
    createdAt: new Date(),
  });

  res.status(201).json({ token: id });
});

// GET /share/:token — public, no auth needed
router.get("/share/:token", async (req, res) => {
  const { token } = req.params;

  const [link] = await db
    .select()
    .from(schema.shareLinksTable)
    .where(eq(schema.shareLinksTable.id, token))
    .limit(1);

  if (!link) {
    res.status(404).json({ error: "Share link not found" });
    return;
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    res.status(410).json({ error: "This share link has expired" });
    return;
  }

  const ids = link.documentIds.split(",").filter(Boolean);

  const docs = await db
    .select()
    .from(schema.documentsTable)
    .where(
      and(
        inArray(schema.documentsTable.id, ids),
        eq(schema.documentsTable.status, "active")
      )
    );

  res.json({
    documents: docs.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
      notes: row.notes,
      sourceUrl: row.sourceUrl,
      uploadedAt: row.uploadedAt.toISOString(),
    })),
  });
});

// GET /share — list owner's share links
router.get("/share", requireAuth, async (req, res) => {
  const ownerId = req.session!.sub;
  const links = await db
    .select()
    .from(schema.shareLinksTable)
    .where(eq(schema.shareLinksTable.ownerId, ownerId));

  res.json(
    links.map((l) => ({
      token: l.id,
      documentIds: l.documentIds.split(",").filter(Boolean),
      expiresAt: l.expiresAt?.toISOString() ?? null,
      createdAt: l.createdAt.toISOString(),
    }))
  );
});

// DELETE /share/:token — revoke (owner only)
router.delete("/share/:token", requireAuth, async (req, res) => {
  const ownerId = req.session!.sub;
  const { token } = req.params;

  const [link] = await db
    .select()
    .from(schema.shareLinksTable)
    .where(eq(schema.shareLinksTable.id, token))
    .limit(1);

  if (!link || link.ownerId !== ownerId) {
    res.status(404).json({ error: "Share link not found" });
    return;
  }

  await db
    .delete(schema.shareLinksTable)
    .where(eq(schema.shareLinksTable.id, token));

  res.status(204).end();
});

export default router;
