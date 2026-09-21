import { Router, type IRouter } from "express";
import { GetDashboardSummaryResponse, ListActivityResponse } from "@workspace/api-zod";
import { activities, bytesUsed, documents } from "../lib/vault-store";

const router: IRouter = Router();
const STORAGE_LIMIT = 15 * 1024 * 1024 * 1024;

router.get("/dashboard/summary", (_req, res) => {
  const activeDocuments = documents.filter((document) => document.status === "active");
  const categoryCounts = new Map<string, number>();
  for (const document of activeDocuments) {
    categoryCounts.set(document.category, (categoryCounts.get(document.category) ?? 0) + 1);
  }

  const data = GetDashboardSummaryResponse.parse({
    documentCount: activeDocuments.length,
    storageUsedBytes: bytesUsed(),
    storageLimitBytes: STORAGE_LIMIT,
    categories: [...categoryCounts.entries()].map(([category, count]) => ({ category, count })),
  });
  res.json(data);
});

router.get("/dashboard/activity", (_req, res) => {
  const data = ListActivityResponse.parse(activities.slice(0, 8));
  res.json(data);
});

export default router;