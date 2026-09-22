import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifySession, parseCookie } from "../lib/session";
import { readIndex } from "../lib/drive";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = parseCookie(req.headers.cookie, "haven_session");
  const session = token ? await verifySession(token) : null;

  if (!session) return res.status(401).json({ error: "Unauthorized" });
  if (session.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });

  const index = await readIndex(session.accessToken, session.folderId);
  const active = index.documents.filter((d) => d.status === "active");
  const storageUsed = active.reduce((sum, d) => sum + (d.sizeBytes ?? 0), 0);

  if (req.url?.includes("/users")) {
    return res.json([
      {
        id: session.sub,
        name: session.name,
        email: session.email,
        status: "ACTIVE",
        documentCount: active.length,
        storageUsedBytes: storageUsed,
        storageLimitBytes: 15 * 1024 * 1024 * 1024,
      },
    ]);
  }

  // overview
  res.json({
    userCount: 1,
    documentCount: active.length,
    storageUsedBytes: storageUsed,
    auditEventCount: index.activities.length,
  });
}
