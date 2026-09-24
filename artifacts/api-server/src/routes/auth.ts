import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq, and, gt } from "drizzle-orm";
import { GetSessionResponse } from "@workspace/api-zod";
import { db, schema } from "../lib/db";
import { signSession, verifySession, cookieHeader, clearCookieHeader, resolveRole, COOKIE_NAME } from "../lib/session";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email";

const router: IRouter = Router();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function upsertOtp(email: string, ttlMinutes = 15): Promise<string> {
  // Invalidate any previous unused OTPs for this email
  await db.update(schema.otpTable)
    .set({ consumed: true })
    .where(and(eq(schema.otpTable.email, email), eq(schema.otpTable.consumed, false)));

  const code = generateOtp();
  await db.insert(schema.otpTable).values({
    id: crypto.randomUUID(),
    email,
    otpCode: code,
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    consumed: false,
  });
  return code;
}

// ── Session ──────────────────────────────────────────────────────────────────

router.get("/auth/session", async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) { res.json({ authenticated: false, user: null }); return; }
  const session = await verifySession(token);
  if (!session) { res.json({ authenticated: false, user: null }); return; }
  res.json(GetSessionResponse.parse({
    authenticated: true,
    user: { id: session.sub, name: session.name, email: session.email, role: session.role, status: "ACTIVE" },
  }));
});

// ── Signup: step 1 — send OTP, store pending data in OTP table metadata ──────
// We store name+passwordHash in the OTP label field (JSON) so we don't create
// the user record until the email is actually verified.

router.post("/auth/signup/request", async (req, res) => {
  const { name, email, password } = req.body as Record<string, string>;
  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: "Name, email and password are required." }); return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." }); return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if a verified account already exists
  const [existing] = await db.select().from(schema.usersTable)
    .where(eq(schema.usersTable.email, normalizedEmail)).limit(1);
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists." }); return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const code = generateOtp();

  // Invalidate old pending OTPs
  await db.update(schema.otpTable)
    .set({ consumed: true })
    .where(and(eq(schema.otpTable.email, normalizedEmail), eq(schema.otpTable.consumed, false)));

  // Store pending signup data in OTP row (label = JSON payload)
  await db.insert(schema.otpTable).values({
    id: crypto.randomUUID(),
    email: normalizedEmail,
    otpCode: code,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    consumed: false,
    // Reuse the label/notes concept — store pending user data as JSON in otpCode context
    // We'll use a separate column approach: store name+hash in a second OTP row keyed by a marker
  });

  // Store pending user data alongside — use a special "pending:" prefixed record
  await db.insert(schema.otpTable).values({
    id: crypto.randomUUID(),
    email: `pending:${normalizedEmail}`,
    otpCode: JSON.stringify({ name: name.trim(), passwordHash, role: resolveRole(normalizedEmail) }),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    consumed: false,
  });

  await sendVerificationEmail(normalizedEmail, code);
  res.status(200).json({ message: "Verification code sent to your email." });
});

// ── Signup: step 2 — verify OTP, create account, set session ─────────────────

router.post("/auth/signup/verify", async (req, res) => {
  const { email, code } = req.body as Record<string, string>;
  if (!email?.trim() || !code?.trim()) {
    res.status(400).json({ error: "Email and code are required." }); return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [otp] = await db.select().from(schema.otpTable).where(
    and(
      eq(schema.otpTable.email, normalizedEmail),
      eq(schema.otpTable.otpCode, code.trim()),
      eq(schema.otpTable.consumed, false),
      gt(schema.otpTable.expiresAt, new Date()),
    )
  ).limit(1);

  if (!otp) { res.status(400).json({ error: "Invalid or expired code." }); return; }

  // Fetch pending user data
  const [pending] = await db.select().from(schema.otpTable).where(
    and(
      eq(schema.otpTable.email, `pending:${normalizedEmail}`),
      eq(schema.otpTable.consumed, false),
      gt(schema.otpTable.expiresAt, new Date()),
    )
  ).limit(1);

  if (!pending) { res.status(400).json({ error: "Signup session expired. Please start again." }); return; }

  const { name, passwordHash, role } = JSON.parse(pending.otpCode) as { name: string; passwordHash: string; role: string };

  // Double-check no account was created in the meantime
  const [existing] = await db.select().from(schema.usersTable)
    .where(eq(schema.usersTable.email, normalizedEmail)).limit(1);
  if (existing) { res.status(409).json({ error: "An account with this email already exists." }); return; }

  const id = crypto.randomUUID();
  await db.insert(schema.usersTable).values({ id, name, email: normalizedEmail, passwordHash, role, emailVerified: true });

  // Consume both OTP rows
  await db.update(schema.otpTable).set({ consumed: true }).where(eq(schema.otpTable.id, otp.id));
  await db.update(schema.otpTable).set({ consumed: true }).where(eq(schema.otpTable.id, pending.id));

  const token = await signSession({ sub: id, name, email: normalizedEmail, role });
  res.setHeader("Set-Cookie", cookieHeader(token));
  res.status(201).json({ id, name, email: normalizedEmail, role });
});

// ── Login ─────────────────────────────────────────────────────────────────────

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as Record<string, string>;
  if (!email?.trim() || !password) {
    res.status(400).json({ error: "Email and password are required." }); return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db.select().from(schema.usersTable)
    .where(eq(schema.usersTable.email, normalizedEmail)).limit(1);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password." }); return;
  }
  const token = await signSession({ sub: user.id, name: user.name, email: user.email, role: user.role });
  res.setHeader("Set-Cookie", cookieHeader(token));
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// ── Logout ────────────────────────────────────────────────────────────────────

router.post("/auth/logout", (_req, res) => {
  res.setHeader("Set-Cookie", clearCookieHeader());
  res.status(204).end();
});

// ── Forgot password: step 1 — send OTP ───────────────────────────────────────

router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body as Record<string, string>;
  if (!email?.trim()) { res.status(400).json({ error: "Email is required." }); return; }
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db.select().from(schema.usersTable)
    .where(eq(schema.usersTable.email, normalizedEmail)).limit(1);
  if (user) {
    const code = await upsertOtp(normalizedEmail);
    await sendPasswordResetEmail(normalizedEmail, code);
  }
  // Always return the same response to prevent email enumeration
  res.json({ message: "If an account with that email exists, a reset code has been sent." });
});

// ── Forgot password: step 2 — verify OTP + set new password ──────────────────

router.post("/auth/forgot-password/verify", async (req, res) => {
  const { email, code, newPassword } = req.body as Record<string, string>;
  if (!email?.trim() || !code?.trim() || !newPassword) {
    res.status(400).json({ error: "Email, code and new password are required." }); return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." }); return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const [otp] = await db.select().from(schema.otpTable).where(
    and(
      eq(schema.otpTable.email, normalizedEmail),
      eq(schema.otpTable.otpCode, code.trim()),
      eq(schema.otpTable.consumed, false),
      gt(schema.otpTable.expiresAt, new Date()),
    )
  ).limit(1);
  if (!otp) { res.status(400).json({ error: "Invalid or expired code." }); return; }
  await db.update(schema.usersTable)
    .set({ passwordHash: await bcrypt.hash(newPassword, 10) })
    .where(eq(schema.usersTable.email, normalizedEmail));
  await db.update(schema.otpTable).set({ consumed: true }).where(eq(schema.otpTable.id, otp.id));
  res.json({ message: "Password updated. You can now sign in." });
});

export default router;
