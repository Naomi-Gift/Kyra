/**
 * Trust Monitor
 *
 * Queries TrustScoreUpdated events from the last N blocks,
 * finds members whose score dropped below LOW_RISK (60) or HIGH_RISK (40),
 * and calls notifyLowTrust() for each.
 *
 * Called once per agent cycle from runAllGroups().
 */

import { parseAbiItem } from "viem";
import { publicClient }  from "./chain.js";
import { config }        from "./config.js";
import { logger }        from "./logger.js";
import { notifyLowTrust } from "./notifications.js";

const LOW_RISK_THRESHOLD = 60;

// ABI item for TrustScoreUpdated event
const TRUST_SCORE_UPDATED_EVENT = parseAbiItem(
  "event TrustScoreUpdated(address indexed member, uint256 oldScore, uint256 newScore)"
);

// Simple in-memory map of member → email for notification routing.
// In production this would come from a database or member registry.
// For now, populated via MEMBER_EMAILS env var as JSON:
//   MEMBER_EMAILS='{"0xabc...":"alice@example.com","0xdef...":"bob@example.com"}'
function getMemberEmails(): Record<string, string> {
  try {
    return JSON.parse(process.env.MEMBER_EMAILS ?? "{}");
  } catch {
    return {};
  }
}

export async function runTrustMonitor(): Promise<void> {
  logger.info("Trust monitor: scanning TrustScoreUpdated events");

  try {
    // Look back ~24 hours (~17,280 blocks at ~5s/block on Celo)
    const latestBlock = await publicClient.getBlockNumber();
    const fromBlock   = latestBlock > 17_280n ? latestBlock - 17_280n : 0n;

    const logs = await publicClient.getLogs({
      address:   config.contractAddress as `0x${string}`,
      event:     TRUST_SCORE_UPDATED_EVENT,
      fromBlock,
      toBlock:   latestBlock,
    });

    if (logs.length === 0) {
      logger.debug("No TrustScoreUpdated events in range");
      return;
    }

    logger.info({ count: logs.length }, "TrustScoreUpdated events found");

    const memberEmails = getMemberEmails();

    // Deduplicate: keep only the latest score per member
    const latestScores = new Map<string, { newScore: bigint; oldScore: bigint }>();
    for (const log of logs) {
      const { member, newScore, oldScore } = log.args as {
        member:   string;
        oldScore: bigint;
        newScore: bigint;
      };
      latestScores.set(member.toLowerCase(), { newScore, oldScore });
    }

    for (const [member, { newScore }] of latestScores) {
      const score = Number(newScore);

      if (score < LOW_RISK_THRESHOLD) {
        const email = memberEmails[member];
        if (!email) {
          logger.debug({ member, score }, "Low trust — no email on file, skipping notification");
          continue;
        }

        logger.warn({ member, score, threshold: LOW_RISK_THRESHOLD }, "Member below trust threshold");

        await notifyLowTrust({
          to:            email,
          memberAddress: member,
          groupName:     "your savings circle",   // TODO: resolve from group membership
          trustScore:    score,
          threshold:     LOW_RISK_THRESHOLD,
        });
      }
    }
  } catch (err) {
    logger.error({ err }, "Trust monitor error");
  }
}
