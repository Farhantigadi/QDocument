import { type Request, type Response, type NextFunction } from "express";
import { verifySession, COOKIE_NAME, type SessionPayload } from "../lib/session";

declare global {
  namespace Express {
    interface Request {
      session?: SessionPayload;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  const session = await verifySession(token);
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }
  req.session = session;
  next();
}
