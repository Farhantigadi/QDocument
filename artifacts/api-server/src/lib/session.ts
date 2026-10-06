import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? (() => { throw new Error("SESSION_SECRET is not set"); })()
);

export const COOKIE_NAME = "haven_session";
const MAX_AGE = 315360000; // 10 years

export type SessionPayload = {
  sub: string;
  name: string;
  email: string;
  role: string;
};

export function resolveRole(email: string): string {
  const adminEmail = process.env.ADMIN_EMAIL ?? "";
  return email.trim().toLowerCase() === adminEmail.trim().toLowerCase() ? "ADMIN" : "USER";
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { clockTolerance: Infinity });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function cookieHeader(token: string): string {
  const flags = [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${MAX_AGE}`,
    "SameSite=Lax",
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
  ];
  return flags.join("; ");
}

export function clearCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}
