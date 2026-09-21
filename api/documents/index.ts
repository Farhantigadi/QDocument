import type { VercelRequest, VercelResponse } from "@vercel/node";
import { IncomingForm, type File } from "formidable";
import { readFileSync } from "fs";
import { verifySession, parseCookie } from "../lib/session";
import { readIndex, writeIndex, uploadFileToDrive, type DriveDocument } from "../lib/drive";

export const config = { api: { bodyParser: false } };

const MIME_TO_TYPE: Record<string, DriveDocument["fileType"]> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

async function parseForm(req: VercelRequest): Promise<{ fields: Record<string, string>; file?: File }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ maxFileSize: 50 * 1024 * 1024 });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(fields)) flat[k] = Array.isArray(v) ? v[0] : (v ?? "");
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      resolve({ fields: flat, file });
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = parseCookie(req.headers.cookie, "haven_session");
  const session = token ? await verifySession(token) : null;
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const index = await readIndex(session.accessToken, session.folderId);
    const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : "";
    const category = typeof req.query.category === "string" ? req.query.category : "";
    const sort = req.query.sort === "name" || req.query.sort === "size" ? req.query.sort : "recent";

    let docs = index.documents.filter((d) => d.status === "active");
    if (search) docs = docs.filter((d) => [d.title, d.category, ...d.tags].join(" ").toLowerCase().includes(search));
    if (category) docs = docs.filter((d) => d.category === category);
    docs.sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "size") return (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return res.json(docs);
  }

  if (req.method === "POST") {
    const contentType = req.headers["content-type"] ?? "";
    const isMultipart = contentType.includes("multipart/form-data");

    let title = "", category = "", tags: string[] = [], notes = "";
    let sourceType: "upload" | "link" = "upload";
    let sourceUrl: string | null = null;
    let fileType: DriveDocument["fileType"] = null;
    let sizeBytes: number | null = null;
    let driveFileId: string | null = null;

    if (isMultipart) {
      const { fields, file } = await parseForm(req);
      title = fields.title ?? "";
      category = fields.category ?? "";
      tags = fields.tags ? fields.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
      notes = fields.notes ?? "";
      sourceType = "upload";

      if (!file) return res.status(400).json({ error: "File required for upload" });
      const mime = file.mimetype ?? "";
      fileType = MIME_TO_TYPE[mime] ?? null;
      if (!fileType) return res.status(400).json({ error: "Unsupported file type" });
      sizeBytes = file.size;
      const buffer = readFileSync(file.filepath);
      const result = await uploadFileToDrive(session.accessToken, session.folderId, file.originalFilename ?? title, mime, buffer);
      driveFileId = result.driveFileId;
    } else {
      const body = req.body as Record<string, unknown>;
      title = String(body.title ?? "");
      category = String(body.category ?? "");
      tags = Array.isArray(body.tags) ? body.tags.map(String) : [];
      notes = String(body.notes ?? "");
      sourceType = "link";
      sourceUrl = String(body.sourceUrl ?? "");
      if (!sourceUrl) return res.status(400).json({ error: "sourceUrl required for link" });
    }

    if (!title || !category) return res.status(400).json({ error: "title and category required" });

    const now = new Date().toISOString();
    const doc: DriveDocument = {
      id: crypto.randomUUID(),
      title,
      category,
      sourceType,
      tags,
      notes,
      fileType,
      sizeBytes,
      sourceUrl,
      driveFileId,
      uploadedAt: now,
      updatedAt: now,
      status: "active",
    };

    const index = await readIndex(session.accessToken, session.folderId);
    index.documents.unshift(doc);
    index.activities.unshift({ id: crypto.randomUUID(), action: "uploaded", label: `${title} added`, createdAt: now });
    await writeIndex(session.accessToken, session.folderId, index);
    return res.status(201).json(doc);
  }

  res.status(405).end();
}
