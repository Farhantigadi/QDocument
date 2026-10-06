import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { db, schema } from "../lib/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const KEY_HEX = process.env.VAULT_ENCRYPTION_KEY ?? "";
if (KEY_HEX.length !== 64) {
  throw new Error("VAULT_ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
}
const KEY = Buffer.from(KEY_HEX, "hex");

function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv(12):tag(16):ciphertext — all hex
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(stored: string): string {
  const [ivHex, tagHex, dataHex] = stored.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final("utf8");
}

function toPublic(row: typeof schema.credentialsTable.$inferSelect) {
  return {
    id: row.id,
    accountName: row.accountName,
    username: row.username,
    websiteUrl: row.websiteUrl,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ── List credentials (no passwords) ──────────────────────────────────────────
router.get("/vault", requireAuth, async (req, res) => {
  const rows = await db.select().from(schema.credentialsTable)
    .where(eq(schema.credentialsTable.userId, req.session!.sub));
  res.json(rows.map(toPublic));
});

// ── Get one credential with decrypted password ────────────────────────────────
router.get("/vault/:id", requireAuth, async (req, res) => {
  const [row] = await db.select().from(schema.credentialsTable)
    .where(and(
      eq(schema.credentialsTable.id, req.params.id),
      eq(schema.credentialsTable.userId, req.session!.sub),
    )).limit(1);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...toPublic(row), password: decrypt(row.encryptedPassword) });
});

// ── Create credential ─────────────────────────────────────────────────────────
router.post("/vault", requireAuth, async (req, res) => {
  const { accountName, username = "", password, websiteUrl = "", notes = "" } =
    req.body as Record<string, string>;
  if (!accountName?.trim()) { res.status(400).json({ error: "accountName is required" }); return; }
  if (!password) { res.status(400).json({ error: "password is required" }); return; }

  const now = new Date();
  const row = {
    id: crypto.randomUUID(),
    userId: req.session!.sub,
    accountName: accountName.trim(),
    username: username.trim(),
    encryptedPassword: encrypt(password),
    websiteUrl: websiteUrl.trim(),
    notes: notes.trim(),
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(schema.credentialsTable).values(row);
  res.status(201).json(toPublic(row));
});

// ── Update credential ─────────────────────────────────────────────────────────
router.patch("/vault/:id", requireAuth, async (req, res) => {
  const [existing] = await db.select().from(schema.credentialsTable)
    .where(and(
      eq(schema.credentialsTable.id, req.params.id),
      eq(schema.credentialsTable.userId, req.session!.sub),
    )).limit(1);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const { accountName, username, password, websiteUrl, notes } =
    req.body as Record<string, string>;

  const updates: Partial<typeof schema.credentialsTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (accountName !== undefined) updates.accountName = accountName.trim();
  if (username !== undefined) updates.username = username.trim();
  if (password) updates.encryptedPassword = encrypt(password);
  if (websiteUrl !== undefined) updates.websiteUrl = websiteUrl.trim();
  if (notes !== undefined) updates.notes = notes.trim();

  await db.update(schema.credentialsTable).set(updates)
    .where(eq(schema.credentialsTable.id, req.params.id));

  const [updated] = await db.select().from(schema.credentialsTable)
    .where(eq(schema.credentialsTable.id, req.params.id)).limit(1);
  res.json(toPublic(updated));
});

// ── Delete credential ─────────────────────────────────────────────────────────
router.delete("/vault/:id", requireAuth, async (req, res) => {
  const [existing] = await db.select().from(schema.credentialsTable)
    .where(and(
      eq(schema.credentialsTable.id, req.params.id),
      eq(schema.credentialsTable.userId, req.session!.sub),
    )).limit(1);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  await db.delete(schema.credentialsTable)
    .where(eq(schema.credentialsTable.id, req.params.id));
  res.status(204).end();
});

export default router;
