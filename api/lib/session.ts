import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-secret-change-me");
const COOKIE = "haven_session";
const MAX_AGE = 315360000; // 10 years in seconds
const ADMIN_EMAIL = "farhantigadi123@gmail.com";

export type SessionPayload = {
  sub: string;
  name: string;
  email: string;
  picture: string;
  role: "USER" | "ADMIN";
  accessToken: string;
  refreshToken: string;
  folderId: string;
};

export function resolveRole(email: string): "USER" | "ADMIN" {
  return email.trim().toLowerCase() === ADMIN_EMAIL ? "ADMIN" : "USER";
}

export async function signSession(payload: SessionPayload): Promise<string> {
  // No expiration — session is permanent until explicit logout
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      // Disable expiration check — tokens have no exp claim
      clockTolerance: Infinity,
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function cookieHeader(token: string): string {
  const expires = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toUTCString();
  const flags = [
    `${COOKIE}=${token}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${MAX_AGE}`,
    `Expires=${expires}`,
    "SameSite=Lax",
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
  ];
  return flags.join("; ");
}

export function clearCookieHeader(): string {
  return `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

export function parseCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
