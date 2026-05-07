import { createServer } from "http";
import cron from "node-cron";
import app from "./app";
import { logger } from "./lib/logger";
import { setupWebSocket } from "./lib/wsManager";
import { processDailyPayout } from "./lib/dailyPayout";
import { sendDatabaseBackupEmail } from "./lib/email";
import { db, platformSettingsTable } from "@workspace/db";

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

const server = createServer(app);
setupWebSocket(server);

// ── Daily payout cron: Mon–Fri at 03:00 AM IST (= 21:30 UTC Sun–Thu) ──
// IST = UTC+5:30 → 03:00 IST = 21:30 UTC previous day
// Sun–Thu UTC covers Mon–Fri IST
cron.schedule("30 21 * * 0-4", async () => {
  try {
    const [settings] = await db.select().from(platformSettingsTable).limit(1);
    if (settings && !settings.autoRoiEnabled) {
      logger.info("Cron skipped: auto ROI is disabled by admin");
      return;
    }
  } catch (err) {
    logger.warn({ err }, "Cron: could not read settings, proceeding with payout");
  }
  logger.info("Cron triggered: running daily payout (Mon–Fri 03:00 IST / 21:30 UTC)");
  try {
    const stats = await processDailyPayout();
    logger.info(stats, "Cron daily payout finished");
  } catch (err) {
    logger.error({ err }, "Cron daily payout failed");
  }
});

logger.info("Daily payout cron scheduled — Mon–Fri 03:00 AM IST (21:30 UTC Sun–Thu)");

// ── Hourly DB backup cron ──────────────────────────────────────────────────
cron.schedule("0 * * * *", async () => {
  logger.info("Cron: starting hourly database backup");
  try {
    const result = await sendDatabaseBackupEmail();
    if (result.sent) {
      logger.info("Cron: database backup email sent successfully");
    } else {
      logger.info({ reason: result.error }, "Cron: database backup skipped");
    }
  } catch (err) {
    logger.error({ err }, "Cron: database backup failed");
  }
});

logger.info("Hourly DB backup cron scheduled — every hour at :00");

server.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
