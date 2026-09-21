import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifySession, parseCookie } from "../../lib/session";
import { readIndex, writeIndex, deleteFileFromDrive } from "../../lib/drive";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = parseCookie(req.headers.cookie, "haven_session");
  const session = token ? await verifySession(token) : null;
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const documentId = typeof req.query.documentId === "string" ? req.query.documentId : "";
  const index = await readIndex(session.accessToken, session.folderId);
  const doc = index.documents.find((d) => d.id === documentId);

  if (!doc || doc.status === "deleted") return res.status(404).json({ error: "Document not found" });

  if (req.method === "GET") {
    index.activities.unshift({ id: crypto.randomUUID(), action: "viewed", label: `${doc.title} viewed`, createdAt: new Date().toISOString() });
    await writeIndex(session.accessToken, session.folderId, index);
    return res.json(doc);
  }

  if (req.method === "PATCH") {
    const body = req.body as Record<string, unknown>;
    if (body.title) doc.title = String(body.title);
    if (body.category) doc.category = String(body.category);
    if (Array.isArray(body.tags)) doc.tags = body.tags.map(String);
    if (body.notes !== undefined) doc.notes = String(body.notes);
    doc.updatedAt = new Date().toISOString();
    index.activities.unshift({ id: crypto.randomUUID(), action: "updated", label: `${doc.title} updated`, createdAt: doc.updatedAt });
    await writeIndex(session.accessToken, session.folderId, index);
    return res.json(doc);
  }

  if (req.method === "DELETE") {
    doc.status = "deleted";
    doc.updatedAt = new Date().toISOString();
    index.activities.unshift({ id: crypto.randomUUID(), action: "deleted", label: `${doc.title} removed`, createdAt: doc.updatedAt });
    await writeIndex(session.accessToken, session.folderId, index);
    if (doc.driveFileId) {
      await deleteFileFromDrive(session.accessToken, doc.driveFileId).catch(() => null);
    }
    return res.status(204).end();
  }

  res.status(405).end();
}
