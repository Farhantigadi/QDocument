import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-secret-change-me");
const COOKIE = "haven_session";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export type SessionPayload = {
  sub: string;       // Google user id
  name: string;
  email: string;
  picture: string;
  accessToken: string;
  refreshToken: string;
  folderId: string;
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("365d")
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function cookieHeader(token: string): string {
  const flags = [
    `${COOKIE}=${token}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${MAX_AGE}`,
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
