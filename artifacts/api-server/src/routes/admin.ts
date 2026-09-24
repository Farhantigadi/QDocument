import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { GetAdminOverviewResponse, ListUsersResponse } from "@workspace/api-zod";
import { db, schema } from "../lib/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
const STORAGE_LIMIT = 15 * 1024 * 1024 * 1024;

function requireAdmin(req: Parameters<typeof requireAuth>[0], res: Parameters<typeof requireAuth>[1], next: Parameters<typeof requireAuth>[2]) {
  if (req.session?.role !== "ADMIN") { res.status(403).json({ error: "Forbidden" }); return; }
  next();
}

router.get("/admin/overview", requireAuth, requireAdmin, async (_req, res) => {
  const users = await db.select().from(schema.usersTable);
  const docs = await db.select().from(schema.documentsTable).where(eq(schema.documentsTable.status, "active"));
  const activities = await db.select().from(schema.activityTable);
  res.json(GetAdminOverviewResponse.parse({
    userCount: users.length,
    documentCount: docs.length,
    storageUsedBytes: 0,
    auditEventCount: activities.length,
  }));
});

router.delete("/admin/users/:userId", requireAuth, requireAdmin, async (req, res) => {
  const { userId } = req.params;
  if (userId === req.session!.sub) { res.status(400).json({ error: "Cannot delete your own account." }); return; }
  const [user] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found." }); return; }
  await db.delete(schema.usersTable).where(eq(schema.usersTable.id, userId));
  res.status(204).end();
});

router.get("/admin/users", requireAuth, requireAdmin, async (_req, res) => {
  const users = await db.select().from(schema.usersTable);
  const docs = await db.select().from(schema.documentsTable).where(eq(schema.documentsTable.status, "active"));

  const docCountByUser = new Map<string, number>();
  for (const doc of docs) {
    docCountByUser.set(doc.userId, (docCountByUser.get(doc.userId) ?? 0) + 1);
  }

  res.json(ListUsersResponse.parse(users.map(u => ({
    id: u.id, name: u.name, email: u.email, role: u.role, status: "ACTIVE",
    documentCount: docCountByUser.get(u.id) ?? 0,
    storageUsedBytes: 0,
    storageLimitBytes: STORAGE_LIMIT,
  }))));
});

export default router;
