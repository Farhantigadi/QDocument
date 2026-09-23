import type { VercelRequest, VercelResponse } from "@vercel/node";
export const dynamic = "force-dynamic";
import { verifySession, parseCookie } from "../lib/session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = parseCookie(req.headers.cookie, "haven_session");
  if (!token) return res.json({ authenticated: false, user: null });

  const session = await verifySession(token);
  if (!session) return res.json({ authenticated: false, user: null });

  res.json({
    authenticated: true,
    user: {
      id: session.sub,
      name: session.name,
      email: session.email,
      role: session.role,
      status: "ACTIVE",
    },
  });
}
