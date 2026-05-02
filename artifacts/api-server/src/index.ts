import { createServer } from "http";
import cron from "node-cron";
import app from "./app";
import { logger } from "./lib/logger";
import { setupWebSocket } from "./lib/wsManager";
import { processDailyPayout } from "./lib/dailyPayout";

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

// ── Daily payout cron: Mon–Fri at 03:00 AM server time ──
// Expression: minute hour * * day-of-week (1=Mon, 5=Fri)
cron.schedule("0 3 * * 1-5", async () => {
  logger.info("Cron triggered: running daily payout (Mon–Fri 03:00)");
  try {
    const stats = await processDailyPayout();
    logger.info(stats, "Cron daily payout finished");
  } catch (err) {
    logger.error({ err }, "Cron daily payout failed");
  }
});

logger.info("Daily payout cron scheduled — Mon–Fri 03:00 AM");

server.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
