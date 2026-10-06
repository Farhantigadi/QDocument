import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { GetDashboardSummaryResponse, ListActivityResponse } from "@workspace/api-zod";
import { db, schema } from "../lib/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
const STORAGE_LIMIT = 15 * 1024 * 1024 * 1024;

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  const userId = req.session!.sub;
  const docs = await db.select().from(schema.documentsTable)
    .where(and(eq(schema.documentsTable.userId, userId), eq(schema.documentsTable.status, "active")));

  const categoryCounts = new Map<string, number>();
  for (const doc of docs) {
    categoryCounts.set(doc.category, (categoryCounts.get(doc.category) ?? 0) + 1);
  }

  res.json(GetDashboardSummaryResponse.parse({
    documentCount: docs.length,
    storageUsedBytes: 0,
    storageLimitBytes: STORAGE_LIMIT,
    categories: [...categoryCounts.entries()].map(([category, count]) => ({ category, count })),
  }));
});

router.get("/dashboard/activity", requireAuth, async (req, res) => {
  const userId = req.session!.sub;
  const rows = await db.select().from(schema.activityTable)
    .where(eq(schema.activityTable.userId, userId))
    .orderBy(desc(schema.activityTable.createdAt))
    .limit(8);

  res.json(ListActivityResponse.parse(rows.map(r => ({
    id: r.id,
    action: r.action,
    label: r.label,
    createdAt: r.createdAt.toISOString(),
  }))));
});

export default router;
