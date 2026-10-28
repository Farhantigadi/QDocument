import { Router, type IRouter } from "express";
import { db } from "../lib/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Called by Vercel Cron every 4 days — keeps Supabase free-tier from pausing.
// Protected by CRON_SECRET so it can't be triggered by random requests.
router.get("/cron/keep-alive", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers["authorization"] !== `Bearer ${secret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await db.execute(sql`SELECT 1`);
    logger.info("Cron keep-alive: DB ping OK");
    res.json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, "Cron keep-alive: DB ping failed");
    res.status(500).json({ ok: false, error: "DB ping failed" });
  }
});

export default router;
