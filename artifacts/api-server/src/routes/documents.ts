import { Router, type IRouter } from "express";
import {
  CreateDocumentBody,
  GetDocumentParams,
  UpdateDocumentBody,
  UpdateDocumentParams,
} from "@workspace/api-zod";
import {
  addActivity,
  documents,
  findDocument,
  type VaultDocument,
} from "../lib/vault-store";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();

router.get("/documents", (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : "";
  const category = typeof req.query.category === "string" ? req.query.category : "";
  const sort = req.query.sort === "name" || req.query.sort === "size" ? req.query.sort : "recent";

  const filtered = documents
    .filter((document) => document.status === "active")
    .filter((document) => {
      if (!search) return true;
      return [document.title, document.category, ...document.tags]
        .join(" ")
        .toLowerCase()
        .includes(search);
    })
    .filter((document) => !category || document.category === category)
    .sort((left, right) => {
      if (sort === "name") return left.title.localeCompare(right.title);
      if (sort === "size") return (right.sizeBytes ?? 0) - (left.sizeBytes ?? 0);
      return right.updatedAt.localeCompare(left.updatedAt);
    });

  res.json(filtered);
});

router.post("/documents", (req, res) => {
  const input = CreateDocumentBody.parse(req.body);
  if (input.sourceType === "upload" && (!input.fileType || !input.sizeBytes)) {
    res.status(400).json({ error: "Uploaded documents require a file." });
    return;
  }
  if (input.sourceType === "upload" && (!input.objectPath || !input.objectPath.startsWith("/objects/uploads/"))) {
    res.status(400).json({ error: "Uploaded documents require a private object." });
    return;
  }
  if (input.sourceType === "link" && !input.sourceUrl) {
    res.status(400).json({ error: "Linked documents require a URL." });
    return;
  }
  const timestamp = new Date().toISOString();
  const document: VaultDocument = {
    id: crypto.randomUUID(),
    title: input.title,
    category: input.category,
    sourceType: input.sourceType,
    tags: input.tags ?? [],
    notes: input.notes ?? "",
    fileType: input.fileType ?? null,
    sizeBytes: input.sizeBytes ?? null,
    sourceUrl: input.sourceUrl ?? null,
    objectPath: input.objectPath ?? null,
    uploadedAt: timestamp,
    updatedAt: timestamp,
    status: "active",
    thumbnailUrl: null,
  };
  documents.unshift(document);
  addActivity("uploaded", `${document.title} added`);
  res.status(201).json(document);
});

router.get("/documents/:documentId", (req, res) => {
  const { documentId } = GetDocumentParams.parse(req.params);
  const document = findDocument(documentId);
  if (!document || document.status === "deleted") {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  addActivity("viewed", `${document.title} viewed`);
  res.json(document);
});

router.patch("/documents/:documentId", (req, res) => {
  const { documentId } = UpdateDocumentParams.parse(req.params);
  const input = UpdateDocumentBody.parse(req.body);
  const document = findDocument(documentId);
  if (!document || document.status === "deleted") {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  Object.assign(document, input, { updatedAt: new Date().toISOString() });
  addActivity("updated", `${document.title} details updated`);
  res.json(document);
});

router.delete("/documents/:documentId", (req, res) => {
  const { documentId } = GetDocumentParams.parse(req.params);
  const document = findDocument(documentId);
  if (!document || document.status === "deleted") {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  if (document.objectPath) {
    objectStorage.deleteObjectEntity(document.objectPath).catch((error) => {
      req.log.error({ err: error, documentId }, "Could not delete private document object");
    });
  }
  document.status = "deleted";
  document.updatedAt = new Date().toISOString();
  addActivity("deleted", `${document.title} moved to trash`);
  res.status(204).end();
});

export default router;