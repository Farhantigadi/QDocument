import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearCookieHeader } from "../lib/session";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Set-Cookie", clearCookieHeader());
  res.status(204).end();
}
