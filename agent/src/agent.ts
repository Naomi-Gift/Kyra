/**
 * Core agent logic — ChoreVault edition.
 *
 * runAllGroups()
 *   ├─ Read total group count from groupCount()
 *   ├─ For each groupId:
 *   │   ├─ Read group via getGroup()
 *   │   ├─ Skip if not active
 *   │   ├─ collect() if block.timestamp >= nextCollection
 *   │   │   └─ simulate → broadcast → wait 1 confirmation
 *   │   └─ release() if pendingRelease > 0
 *   │       └─ simulate → broadcast → wait 1 confirmation
 *   └─ Send Telegram summary
 */

import { formatUnits, decodeEventLog } from "viem";
import { publicClient, walletClient, account } from "./chain.js";
import { config } from "./config.js";
import { CHORE_VAULT_ABI } from "./abi.js";
import { notify } from "./notify.js";
import { logger } from "./logger.js";

type GroupResult = {
  groupId:  bigint;
  collected: boolean;
  released:  boolean;
  collectTx?: `0x${string}`;
  releaseTx?: `0x${string}`;
  potTotal?:  bigint;
  recipient?: string;
  error?:     string;
};

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function runAllGroups(): Promise<void> {
  const startedAt = Date.now();
  logger.info("Agent cycle starting");

  // Verify we are the registered agent
  const registeredAgent = await publicClient.readContract({
    address:      config.contractAddress,
    abi:          CHORE_VAULT_ABI,
    functionName: "agent",
  });

  if (registeredAgent.toLowerCase() !== account.address.toLowerCase()) {
    logger.error({ registeredAgent, ours: account.address }, "Agent address mismatch — aborting");
    await notify("*ChoreAgent*: agent address mismatch. Check deployment.");
    return;
  }

  // Fetch group count
  const count = await publicClient.readContract({
    address:      config.contractAddress,
    abi:          CHORE_VAULT_ABI,
    functionName: "groupCount",
  });

  logger.info({ count: count.toString() }, "Groups found");
  if (count === 0n) { logger.info("No groups yet"); return; }

  const now     = BigInt(Math.floor(Date.now() / 1000));
  const results: GroupResult[] = [];

  for (let id = 0n; id < count; id++) {
    const result = await processGroup(id, now);
    if (result) results.push(result);
  }

  // Summary
  const elapsed  = ((Date.now() - startedAt) / 1000).toFixed(1);
  const actions  = results.filter(r => r.collected || r.released).length;
  const errors   = results.filter(r => r.error).length;

  logger.info({ actions, errors, elapsed: `${elapsed}s` }, "Agent cycle complete");

  if (results.length === 0) return;

  const lines = [
    `*ChoreAgent* ran — ${new Date().toUTCString()}`,
    `Groups processed: ${actions} | Errors: ${errors}`,
    "",
  ];

  for (const r of results) {
    if (r.error) {
      lines.push(`Group ${r.groupId}: ERROR — ${r.error}`);
    } else {
      if (r.collected) lines.push(`Group ${r.groupId}: collected`);
      if (r.released) {
        const amt = r.potTotal ? `$${formatUnits(r.potTotal, 18)}` : "?";
        lines.push(`Group ${r.groupId}: released ${amt} to ${r.recipient?.slice(0, 10)}...`);
      }
    }
  }

  await notify(lines.join("\n"));
}

// ─── Per-group processing ─────────────────────────────────────────────────────

async function processGroup(groupId: bigint, now: bigint): Promise<GroupResult | null> {
  const group = await publicClient.readContract({
    address:      config.contractAddress,
    abi:          CHORE_VAULT_ABI,
    functionName: "getGroup",
    args:         [groupId],
  });

  const [, , , nextCollection, , active, pendingRelease] = group;

  if (!active) {
    logger.debug({ groupId: groupId.toString() }, "Group inactive — skipping");
    return null;
  }

  const result: GroupResult = { groupId, collected: false, released: false };

  // ── Collect if due ──────────────────────────────────────────────────────────
  if (now >= nextCollection) {
    const collectResult = await sendTx(groupId, "collect");
    if (collectResult.error) {
      result.error = collectResult.error;
      return result;
    }
    result.collected  = true;
    result.collectTx  = collectResult.hash;
  }

  // ── Release if funds are waiting ────────────────────────────────────────────
  // Re-read pendingRelease after collect (may have just been populated)
  const updatedGroup = await publicClient.readContract({
    address:      config.contractAddress,
    abi:          CHORE_VAULT_ABI,
    functionName: "getGroup",
    args:         [groupId],
  });
  const [, , , , , , updatedPending] = updatedGroup;

  if (updatedPending > 0n) {
    const releaseResult = await sendTx(groupId, "release");
    if (releaseResult.error) {
      result.error = releaseResult.error;
      return result;
    }
    result.released   = true;
    result.releaseTx  = releaseResult.hash;
    result.potTotal   = releaseResult.potTotal;
    result.recipient  = releaseResult.recipient;
  }

  return result.collected || result.released ? result : null;
}

// ─── Simulate + broadcast ─────────────────────────────────────────────────────

async function sendTx(
  groupId: bigint,
  fn: "collect" | "release"
): Promise<{ hash?: `0x${string}`; potTotal?: bigint; recipient?: string; error?: string }> {
  // Simulate first
  try {
    await publicClient.simulateContract({
      address:      config.contractAddress,
      abi:          CHORE_VAULT_ABI,
      functionName: fn,
      args:         [groupId],
      account:      account.address,
    });
  } catch (simErr: unknown) {
    const msg = simErr instanceof Error ? simErr.message : String(simErr);
    logger.warn({ groupId: groupId.toString(), fn, error: msg }, "Simulation failed — skipping");
    return { error: `${fn} simulation failed: ${msg}` };
  }

  // Broadcast
  try {
    const hash = await walletClient.writeContract({
      address:      config.contractAddress,
      abi:          CHORE_VAULT_ABI,
      functionName: fn,
      args:         [groupId],
      account,
    });

    logger.info({ groupId: groupId.toString(), fn, hash }, "tx submitted");

    const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

    if (receipt.status !== "success") {
      return { hash, error: "transaction reverted on-chain" };
    }

    // Parse PotReleased event from receipt
    let potTotal: bigint | undefined;
    let recipient: string | undefined;

    if (fn === "release") {
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: CHORE_VAULT_ABI, data: log.data, topics: log.topics });
          if (decoded.eventName === "PotReleased") {
            const args = decoded.args as { recipient: string; total: bigint };
            potTotal  = args.total;
            recipient = args.recipient;
          }
        } catch { /* not a matching log */ }
      }
    }

    return { hash, potTotal, recipient };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ groupId: groupId.toString(), fn, error: msg }, "tx failed");
    return { error: msg };
  }
}
