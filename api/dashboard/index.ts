import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifySession, parseCookie } from "../lib/session";
import { readIndex } from "../lib/drive";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = parseCookie(req.headers.cookie, "haven_session");
  const session = token ? await verifySession(token) : null;
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const index = await readIndex(session.accessToken, session.folderId);
  const active = index.documents.filter((d) => d.status === "active");

  if (req.url?.includes("/activity")) {
    return res.json(index.activities.slice(0, 8));
  }

  // summary
  const categoryMap = new Map<string, number>();
  let storageUsed = 0;
  for (const doc of active) {
    categoryMap.set(doc.category, (categoryMap.get(doc.category) ?? 0) + 1);
    storageUsed += doc.sizeBytes ?? 0;
  }

  res.json({
    documentCount: active.length,
    storageUsedBytes: storageUsed,
    storageLimitBytes: 15 * 1024 * 1024 * 1024,
    categories: [...categoryMap.entries()].map(([category, count]) => ({ category, count })),
  });
}
