/**
 * Kyra — entry point
 *
 * Boot sequence:
 *  1. Register ERC-8004 agent identity (idempotent)
 *  2. Run one immediate cycle
 *  3. Schedule recurring runs via CRON_SCHEDULE
 */

import cron from "node-cron";
import { config }        from "./config.js";
import { logger }        from "./logger.js";
import { runAllGroups }  from "./agent.js";
import { account }       from "./chain.js";
import { registerAgent } from "./erc8004.js";

// ── Overlap guard ─────────────────────────────────────────────────────────────
let running = false;

async function tick() {
  if (running) {
    logger.warn("Previous cycle still running — skipping tick");
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
async function boot() {
  logger.info(
    { agent: account.address, contract: config.contractAddress, schedule: config.cronSchedule },
    "Kyra starting"
  );

  // 1. Register ERC-8004 identity before doing anything else
  const agentId = await registerAgent();
  logger.info({ agentId }, "Agent identity confirmed");

  // 2. Validate cron expression
  if (!cron.validate(config.cronSchedule)) {
    logger.error({ schedule: config.cronSchedule }, "Invalid cron schedule — exiting");
    process.exit(1);
  }

  // 3. Immediate run on startup
  tick();

  // 4. Schedule recurring runs
  cron.schedule(config.cronSchedule, tick);
  logger.info(`Cron scheduled: ${config.cronSchedule}`);
}

// Graceful shutdown
process.on("SIGINT",  () => { logger.info("Shutting down"); process.exit(0); });
process.on("SIGTERM", () => { logger.info("Shutting down"); process.exit(0); });

boot().catch(err => {
  logger.error({ err }, "Boot failed");
  process.exit(1);
});
