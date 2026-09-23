import type { VercelRequest, VercelResponse } from "@vercel/node";
export const dynamic = "force-dynamic";
import { eq } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { verifySession, parseCookie } from "../lib/session";
import { encrypt } from "../lib/crypto";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = parseCookie(req.headers.cookie, "haven_session");
  const session = token ? await verifySession(token) : null;
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const creds = await db
      .select({
        id: schema.credentialsTable.id,
        accountName: schema.credentialsTable.accountName,
        username: schema.credentialsTable.username,
        websiteUrl: schema.credentialsTable.websiteUrl,
        notes: schema.credentialsTable.notes,
        createdAt: schema.credentialsTable.createdAt,
        updatedAt: schema.credentialsTable.updatedAt,
      })
      .from(schema.credentialsTable)
      .where(eq(schema.credentialsTable.userId, session.sub))
      .orderBy(schema.credentialsTable.createdAt);
    // Never return encryptedPassword in list — only metadata
    return res.json(creds);
  }

  if (req.method === "POST") {
    const body = req.body as Record<string, unknown>;
    const accountName = String(body.accountName ?? "").trim();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "").trim();
    const websiteUrl = String(body.websiteUrl ?? "").trim();
    const notes = String(body.notes ?? "").trim();

    if (!accountName || !password) {
      return res.status(400).json({ error: "Account name and password are required." });
    }

    const encryptedPassword = encrypt(password);
    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(schema.credentialsTable).values({
      id,
      userId: session.sub,
      accountName,
      username,
      encryptedPassword,
      websiteUrl,
      notes,
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json({ id, accountName, username, websiteUrl, notes, createdAt: now, updatedAt: now });
  }

  res.status(405).end();
}
