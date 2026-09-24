import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { CreateDocumentBody, GetDocumentParams, UpdateDocumentBody, UpdateDocumentParams } from "@workspace/api-zod";
import { db, schema } from "../lib/db";
import { requireAuth } from "../middlewares/auth";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();

router.get("/documents", requireAuth, async (req, res) => {
  const userId = req.session!.sub;
  const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : "";
  const category = typeof req.query.category === "string" ? req.query.category : "";
  const sort = req.query.sort === "name" || req.query.sort === "size" ? req.query.sort : "recent";

  let rows = await db.select().from(schema.documentsTable)
    .where(and(eq(schema.documentsTable.userId, userId), eq(schema.documentsTable.status, "active")))
    .orderBy(desc(schema.documentsTable.updatedAt));

  if (search) rows = rows.filter(d => [d.title, d.category, d.tags].join(" ").toLowerCase().includes(search));
  if (category) rows = rows.filter(d => d.category === category);
  if (sort === "name") rows.sort((a, b) => a.title.localeCompare(b.title));

  res.json(rows.map(toDoc));
});

router.post("/documents", requireAuth, async (req, res) => {
  const userId = req.session!.sub;
  const input = CreateDocumentBody.parse(req.body);
  if (input.sourceType === "upload" && (!input.fileType || !input.sizeBytes)) {
    res.status(400).json({ error: "Uploaded documents require a file." }); return;
  }
  if (input.sourceType === "link" && !input.sourceUrl) {
    res.status(400).json({ error: "Linked documents require a URL." }); return;
  }
  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(schema.documentsTable).values({
    id, userId, title: input.title, category: input.category,
    sourceUrl: input.sourceUrl ?? null, tags: (input.tags ?? []).join(","),
    notes: input.notes ?? "", status: "active", uploadedAt: now, updatedAt: now,
  });
  await db.insert(schema.activityTable).values({
    id: crypto.randomUUID(), userId, action: "uploaded", label: `${input.title} added`, createdAt: now,
  });
  const [row] = await db.select().from(schema.documentsTable).where(eq(schema.documentsTable.id, id)).limit(1);
  res.status(201).json(toDoc(row));
});

router.get("/documents/:documentId", requireAuth, async (req, res) => {
  const userId = req.session!.sub;
  const { documentId } = GetDocumentParams.parse(req.params);
  const [row] = await db.select().from(schema.documentsTable)
    .where(and(eq(schema.documentsTable.id, documentId), eq(schema.documentsTable.userId, userId))).limit(1);
  if (!row || row.status === "deleted") { res.status(404).json({ error: "Document not found" }); return; }
  await db.insert(schema.activityTable).values({
    id: crypto.randomUUID(), userId, action: "viewed", label: `${row.title} viewed`, createdAt: new Date(),
  });
  res.json(toDoc(row));
});

router.patch("/documents/:documentId", requireAuth, async (req, res) => {
  const userId = req.session!.sub;
  const { documentId } = UpdateDocumentParams.parse(req.params);
  const input = UpdateDocumentBody.parse(req.body);
  const [row] = await db.select().from(schema.documentsTable)
    .where(and(eq(schema.documentsTable.id, documentId), eq(schema.documentsTable.userId, userId))).limit(1);
  if (!row || row.status === "deleted") { res.status(404).json({ error: "Document not found" }); return; }
  const now = new Date();
  await db.update(schema.documentsTable).set({
    ...(input.title && { title: input.title }),
    ...(input.category && { category: input.category }),
    ...(input.tags && { tags: input.tags.join(",") }),
    ...(input.notes !== undefined && { notes: input.notes }),
    updatedAt: now,
  }).where(eq(schema.documentsTable.id, documentId));
  await db.insert(schema.activityTable).values({
    id: crypto.randomUUID(), userId, action: "updated", label: `${row.title} details updated`, createdAt: now,
  });
  const [updated] = await db.select().from(schema.documentsTable).where(eq(schema.documentsTable.id, documentId)).limit(1);
  res.json(toDoc(updated));
});

router.delete("/documents/:documentId", requireAuth, async (req, res) => {
  const userId = req.session!.sub;
  const { documentId } = GetDocumentParams.parse(req.params);
  const [row] = await db.select().from(schema.documentsTable)
    .where(and(eq(schema.documentsTable.id, documentId), eq(schema.documentsTable.userId, userId))).limit(1);
  if (!row || row.status === "deleted") { res.status(404).json({ error: "Document not found" }); return; }
  if (row.sourceUrl?.startsWith("/objects/")) {
    objectStorage.deleteObjectEntity(row.sourceUrl).catch(() => {});
  }
  await db.update(schema.documentsTable).set({ status: "deleted", updatedAt: new Date() })
    .where(eq(schema.documentsTable.id, documentId));
  await db.insert(schema.activityTable).values({
    id: crypto.randomUUID(), userId, action: "deleted", label: `${row.title} moved to trash`, createdAt: new Date(),
  });
  res.status(204).end();
});

function toDoc(row: typeof schema.documentsTable.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    sourceType: row.sourceUrl ? "link" : "upload",
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
    notes: row.notes,
    fileType: null,
    sizeBytes: null,
    sourceUrl: row.sourceUrl,
    objectPath: null,
    uploadedAt: row.uploadedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    status: row.status,
    thumbnailUrl: null,
  };
}

export default router;
