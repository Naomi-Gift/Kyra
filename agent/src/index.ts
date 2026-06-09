/**
 * ChoreAgent — entry point
 *
 * Runs the agent on a cron schedule defined by CRON_SCHEDULE env var.
 * Also executes one immediate run on startup so you don't have to wait
 * for the first cron tick.
 */

import cron from "node-cron";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { runAllGroups } from "./agent.js";
import { account } from "./chain.js";

// Prevent overlapping runs
let running = false;

async function tick() {
  if (running) {
    logger.warn("Previous cycle still running — skipping this tick");
    return;
  }
  running = true;
  try {
    await runAllGroups();
  } catch (err) {
    logger.error({ err }, "Unhandled error in agent cycle");
  } finally {
    running = false;
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
logger.info(
  {
    agent:    account.address,
    contract: config.contractAddress,
    schedule: config.cronSchedule,
  },
  "ChoreAgent starting"
);

// Run immediately on startup
tick();

// Schedule recurring runs
if (!cron.validate(config.cronSchedule)) {
  logger.error({ schedule: config.cronSchedule }, "Invalid cron schedule — exiting");
  process.exit(1);
}

cron.schedule(config.cronSchedule, tick);

logger.info(`Scheduled: ${config.cronSchedule}`);

// Graceful shutdown
process.on("SIGINT",  () => { logger.info("Shutting down"); process.exit(0); });
process.on("SIGTERM", () => { logger.info("Shutting down"); process.exit(0); });
