import type { VercelRequest, VercelResponse } from "@vercel/node";
export const dynamic = "force-dynamic";
import bcrypt from "bcryptjs";
import { eq, and, gt } from "drizzle-orm";
import { db, schema } from "../lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "POST" && req.url?.includes("/verify")) return verifyOtp(req, res);
  if (req.method === "POST") return requestOtp(req, res);
  res.status(405).end();
}

async function requestOtp(req: VercelRequest, res: VercelResponse) {
  const { email } = req.body as Record<string, string>;
  if (!email?.trim()) return res.status(400).json({ error: "Email is required." });

  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.email, normalizedEmail)).limit(1);
  if (!user) return res.json({ message: "If this email exists, a code has been sent." });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.insert(schema.otpTable).values({
    id: crypto.randomUUID(),
    email: normalizedEmail,
    otpCode: code,
    expiresAt,
    consumed: false,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] OTP for ${normalizedEmail}: ${code}`);
  }
  // TODO: send email in production via Resend/SendGrid

  res.json({ message: "If this email exists, a code has been sent." });
}

async function verifyOtp(req: VercelRequest, res: VercelResponse) {
  const { email, code, newPassword } = req.body as Record<string, string>;
  if (!email?.trim() || !code?.trim() || !newPassword) {
    return res.status(400).json({ error: "Email, code and new password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();

  const [otp] = await db
    .select()
    .from(schema.otpTable)
    .where(
      and(
        eq(schema.otpTable.email, normalizedEmail),
        eq(schema.otpTable.otpCode, code.trim()),
        eq(schema.otpTable.consumed, false),
        gt(schema.otpTable.expiresAt, now)
      )
    )
    .limit(1);

  if (!otp) return res.status(400).json({ error: "Invalid or expired code." });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(schema.usersTable).set({ passwordHash }).where(eq(schema.usersTable.email, normalizedEmail));
  await db.update(schema.otpTable).set({ consumed: true }).where(eq(schema.otpTable.id, otp.id));

  res.json({ message: "Password updated successfully." });
}
