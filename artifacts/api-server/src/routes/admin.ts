import { Router, type IRouter } from "express";
import { GetAdminOverviewResponse, ListUsersResponse } from "@workspace/api-zod";
import { bytesUsed, demoUser, documents } from "../lib/vault-store";

const router: IRouter = Router();
const STORAGE_LIMIT = 15 * 1024 * 1024 * 1024;

router.get("/admin/overview", (_req, res) => {
  const data = GetAdminOverviewResponse.parse({
    userCount: 1,
    documentCount: documents.filter((document) => document.status === "active").length,
    storageUsedBytes: bytesUsed(),
    auditEventCount: 12,
  });
  res.json(data);
});

router.get("/admin/users", (_req, res) => {
  const data = ListUsersResponse.parse([
    {
      ...demoUser,
      documentCount: documents.filter((document) => document.status === "active").length,
      storageUsedBytes: bytesUsed(),
      storageLimitBytes: STORAGE_LIMIT,
    },
  ]);
  res.json(data);
});

export default router;