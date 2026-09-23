import type { VercelRequest, VercelResponse } from "@vercel/node";
export const dynamic = "force-dynamic";
import { eq, and } from "drizzle-orm";
import { db, schema } from "../../lib/db";
import { verifySession, parseCookie } from "../../lib/session";
import { encrypt, decrypt } from "../../lib/crypto";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = parseCookie(req.headers.cookie, "haven_session");
  const session = token ? await verifySession(token) : null;
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const credentialId = typeof req.query.credentialId === "string" ? req.query.credentialId : "";
  const [cred] = await db
    .select()
    .from(schema.credentialsTable)
    .where(and(eq(schema.credentialsTable.id, credentialId), eq(schema.credentialsTable.userId, session.sub)))
    .limit(1);

  if (!cred) return res.status(404).json({ error: "Credential not found" });

  // GET — return with decrypted password (owner only, server-side decrypt)
  if (req.method === "GET") {
    return res.json({
      id: cred.id,
      accountName: cred.accountName,
      username: cred.username,
      password: decrypt(cred.encryptedPassword),
      websiteUrl: cred.websiteUrl,
      notes: cred.notes,
      createdAt: cred.createdAt,
      updatedAt: cred.updatedAt,
    });
  }

  if (req.method === "PATCH") {
    const body = req.body as Record<string, unknown>;
    const updates: Partial<typeof schema.credentialsTable.$inferInsert> = { updatedAt: new Date() };
    if (body.accountName) updates.accountName = String(body.accountName);
    if (body.username !== undefined) updates.username = String(body.username);
    if (body.password) updates.encryptedPassword = encrypt(String(body.password));
    if (body.websiteUrl !== undefined) updates.websiteUrl = String(body.websiteUrl);
    if (body.notes !== undefined) updates.notes = String(body.notes);

    await db.update(schema.credentialsTable).set(updates).where(eq(schema.credentialsTable.id, credentialId));
    return res.json({ ...cred, ...updates, encryptedPassword: undefined });
  }

  if (req.method === "DELETE") {
    await db.delete(schema.credentialsTable).where(eq(schema.credentialsTable.id, credentialId));
    return res.status(204).end();
  }

  res.status(405).end();
}
