import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Ping DB every 4 days so Supabase free-tier doesn't pause (pauses after 7 days idle)
const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;
setInterval(async () => {
  try {
    await pool.query("SELECT 1");
    logger.info("DB keep-alive ping OK");
  } catch (err) {
    logger.warn({ err }, "DB keep-alive ping failed");
  }
}, FOUR_DAYS_MS);

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
