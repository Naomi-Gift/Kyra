/**
 * Core agent logic.
 *
 * runAllGroups()
 *   ├─ Fetch total group count from contract
 *   ├─ For each group:
 *   │   ├─ Skip if status ≠ Active
 *   │   ├─ Skip if nextCycleAt > now
 *   │   ├─ Simulate (eth_call) before broadcasting
 *   │   └─ Send runCycle(groupId) transaction
 *   └─ Post summary via notify()
 */

import { parseAbiItem, formatUnits } from "viem";
import { publicClient, walletClient, account } from "./chain.js";
import { config } from "./config.js";
import { CHORE_AGENT_ABI } from "./abi.js";
import { notify } from "./notify.js";
import { logger } from "./logger.js";

// GroupStatus enum mirrors the Solidity enum
const enum GroupStatus {
  Active     = 0,
  Collecting = 1,
  Completed  = 2,
  Paused     = 3,
}

type CycleResult = {
  groupId:   bigint;
  groupName: string;
  success:   boolean;
  txHash?:   `0x${string}`;
  error?:    string;
  potAmount?: bigint;
  recipient?: string;
};

export async function runAllGroups(): Promise<void> {
  const startedAt = Date.now();
  logger.info("Agent cycle starting…");

  // ── Verify agent identity ─────────────────────────────────────────────────
  const registeredAgent = await publicClient.readContract({
    address: config.contractAddress,
    abi:     CHORE_AGENT_ABI,
    functionName: "agentAddress",
  });

  if (registeredAgent.toLowerCase() !== account.address.toLowerCase()) {
    logger.error(
      { registered: registeredAgent, ours: account.address },
      "Agent address mismatch — aborting"
    );
    await notify("⚠️ *ChoreAgent*: agent address mismatch. Check deployment.");
    return;
  }

  // ── Fetch group count ─────────────────────────────────────────────────────
  const groupCount = await publicClient.readContract({
    address:      config.contractAddress,
    abi:          CHORE_AGENT_ABI,
    functionName: "allGroups",
  });

  logger.info({ groupCount: groupCount.toString() }, "Groups found");

  if (groupCount === 0n) {
    logger.info("No groups yet. Sleeping.");
    return;
  }

  const now      = BigInt(Math.floor(Date.now() / 1000));
  const results: CycleResult[] = [];

  // ── Process each group ────────────────────────────────────────────────────
  for (let id = 0n; id < groupCount; id++) {
    const result = await processGroup(id, now);
    if (result) results.push(result);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const elapsed   = ((Date.now() - startedAt) / 1000).toFixed(1);
  const succeeded = results.filter(r => r.success).length;
  const failed    = results.filter(r => !r.success).length;
  const skipped   = Number(groupCount) - results.length;

  logger.info(
    { succeeded, failed, skipped, elapsed: `${elapsed}s` },
    "Agent cycle complete"
  );

  if (results.length === 0) return;

  // Build notification message
  const lines = [
    `⚡ *ChoreAgent ran* — ${new Date().toUTCString()}`,
    ``,
    `📊 Groups: ${groupCount} total · ${succeeded} cycled · ${failed} failed · ${skipped} skipped`,
    ``,
  ];

  for (const r of results) {
    if (r.success) {
      const pot = r.potAmount ? `$${formatUnits(r.potAmount, 18)}` : "—";
      lines.push(`✅ *${r.groupName}* — pot ${pot} → \`${r.recipient?.slice(0, 10)}…\``);
      lines.push(`   TX: \`${r.txHash}\``);
    } else {
      lines.push(`❌ *${r.groupName}* — ${r.error}`);
    }
  }

  await notify(lines.join("\n"));
}

// ── Process a single group ─────────────────────────────────────────────────────

async function processGroup(
  groupId: bigint,
  now:     bigint
): Promise<CycleResult | null> {
  // Read group state
  const group = await publicClient.readContract({
    address:      config.contractAddress,
    abi:          CHORE_AGENT_ABI,
    functionName: "getGroup",
    args:         [groupId],
  });

  const [name,,,,,lastCycleAt, currentRound, status] = group;

  // Skip non-active groups
  if (Number(status) !== GroupStatus.Active) {
    logger.debug({ groupId: groupId.toString(), status }, "Skipping group (not active)");
    return null;
  }

  // Check if cycle is due
  const nextCycle = await publicClient.readContract({
    address:      config.contractAddress,
    abi:          CHORE_AGENT_ABI,
    functionName: "nextCycleAt",
    args:         [groupId],
  });

  if (now < nextCycle) {
    const secsLeft = Number(nextCycle - now);
    logger.debug(
      { groupId: groupId.toString(), name, secsLeft },
      "Too early — skipping"
    );
    return null;
  }

  logger.info({ groupId: groupId.toString(), name, round: currentRound }, "Running cycle");

  // ── Simulate first ───────────────────────────────────────────────────────
  try {
    await publicClient.simulateContract({
      address:      config.contractAddress,
      abi:          CHORE_AGENT_ABI,
      functionName: "runCycle",
      args:         [groupId],
      account:      account.address,
    });
  } catch (simErr: unknown) {
    const errMsg = simErr instanceof Error ? simErr.message : String(simErr);
    logger.error({ groupId: groupId.toString(), name, error: errMsg }, "Simulation failed");
    return { groupId, groupName: name, success: false, error: `Simulation: ${errMsg}` };
  }

  // ── Broadcast ────────────────────────────────────────────────────────────
  try {
    const txHash = await walletClient.writeContract({
      address:      config.contractAddress,
      abi:          CHORE_AGENT_ABI,
      functionName: "runCycle",
      args:         [groupId],
      account,
    });

    logger.info({ groupId: groupId.toString(), name, txHash }, "runCycle submitted");

    // Wait for 1 confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, confirmations: 1 });

    if (receipt.status !== "success") {
      return { groupId, groupName: name, success: false, txHash, error: "Transaction reverted" };
    }

    // Parse CycleRun event from receipt to get pot amount & recipient
    const cycleRunTopic = "CycleRun" as const;
    let potAmount: bigint | undefined;
    let recipient: string | undefined;

    for (const log of receipt.logs) {
      try {
        const { decodeEventLog } = await import("viem");
        const decoded = decodeEventLog({
          abi:    CHORE_AGENT_ABI,
          data:   log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "CycleRun") {
          potAmount = (decoded.args as { potAmount: bigint }).potAmount;
          recipient = (decoded.args as { recipient: string }).recipient;
        }
      } catch {
        // not a matching log — ignore
      }
    }

    logger.info(
      { groupId: groupId.toString(), name, txHash, potAmount: potAmount?.toString(), recipient },
      "Cycle complete"
    );

    return { groupId, groupName: name, success: true, txHash, potAmount, recipient };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error({ groupId: groupId.toString(), name, error: errMsg }, "runCycle failed");
    return { groupId, groupName: name, success: false, error: errMsg };
  }
}
