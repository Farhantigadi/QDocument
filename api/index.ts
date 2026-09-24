import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../artifacts/api-server/src/app";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Strip the /api prefix since Express mounts routes under /api internally
  app(req as never, res as never);
}
