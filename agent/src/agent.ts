/**
 * Core agent logic — KyraVault.
 *
 * runAllGroups()
 *   1. Verify agent identity
 *   2. Use block.timestamp (not Date.now) for cycle comparisons
 *   3. For each active group: collect → email members → release → email recipient
 *   4. Run trust monitor to flag low-score members
 *   5. Send Telegram summary
 */

import { formatUnits, decodeEventLog, parseAbiItem } from "viem";
import { publicClient, walletClient, account }        from "./chain.js";
import { config }                                      from "./config.js";
import { KYRA_VAULT_ABI }                             from "./abi.js";
import { notify }                                      from "./notify.js";
import { logger }                                      from "./logger.js";
import {
  notifyCollection,
  notifyCollectionFailed,
  notifyPotReceived,
  notifyOnrampNeeded,
} from "./notifications.js";
import { runTrustMonitor } from "./trustMonitor.js";

// ── Member email registry ─────────────────────────────────────────────────────
// Populated via MEMBER_EMAILS env var as JSON object: address → email
// e.g.  MEMBER_EMAILS='{"0xabc...":"alice@example.com"}'
function memberEmail(address: string): string | undefined {
  try {
    const map: Record<string, string> = JSON.parse(process.env.MEMBER_EMAILS ?? "{}");
    return map[address.toLowerCase()];
  } catch {
    return undefined;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type GroupResult = {
  groupId:   bigint;
  collected: boolean;
  released:  boolean;
  collectTx?: `0x${string}`;
  releaseTx?: `0x${string}`;
  potTotal?:  bigint;
  yield?:     bigint;
  recipient?: string;
  error?:     string;
};

// ── Entry point ───────────────────────────────────────────────────────────────

export async function runAllGroups(): Promise<void> {
  const startedAt = Date.now();
  logger.info("Agent cycle starting");

  // 1. Verify agent identity matches contract
  const registeredAgent = await publicClient.readContract({
    address:      config.contractAddress,
    abi:          KYRA_VAULT_ABI,
    functionName: "agent",
  });
  if (registeredAgent.toLowerCase() !== account.address.toLowerCase()) {
    logger.error({ registeredAgent, ours: account.address }, "Agent address mismatch — aborting");
    await notify("*Kyra*: agent address mismatch. Check deployment.");
    return;
  }

  // 2. Use on-chain block.timestamp for accurate cycle comparisons
  const block = await publicClient.getBlock();
  const now   = block.timestamp;

  // 3. Fetch total group count
  const count = await publicClient.readContract({
    address:      config.contractAddress,
    abi:          KYRA_VAULT_ABI,
    functionName: "groupCount",
  });
  logger.info({ count: count.toString() }, "Groups found");
  if (count === 0n) {
    logger.info("No groups yet");
    return;
  }

  // 4. Process each group sequentially
  const results: GroupResult[] = [];
  for (let id = 0n; id < count; id++) {
    const result = await processGroup(id, now);
    if (result) results.push(result);
  }

  // 5. Run trust monitor (scan events, email low-score members)
  await runTrustMonitor();

  // 6. Telegram summary
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  const actions = results.filter(r => r.collected || r.released).length;
  const errors  = results.filter(r => r.error).length;
  logger.info({ actions, errors, elapsed: `${elapsed}s` }, "Agent cycle complete");

  if (results.length === 0) return;

  const lines = [
    `*Kyra* ran — ${new Date().toUTCString()}`,
    `Groups: ${count} total | ${actions} actioned | ${errors} errors`,
    "",
  ];
  for (const r of results) {
    if (r.error) {
      lines.push(`Group ${r.groupId}: ERROR — ${r.error}`);
    } else {
      if (r.collected) lines.push(`Group ${r.groupId}: collected ✓`);
      if (r.released) {
        const amt = r.potTotal ? `$${formatUnits(r.potTotal, 18)}` : "?";
        lines.push(`Group ${r.groupId}: released ${amt} to ${r.recipient?.slice(0, 10)}...`);
      }
    }
  }
  await notify(lines.join("\n"));
}

// ── Per-group ─────────────────────────────────────────────────────────────────

async function processGroup(groupId: bigint, now: bigint): Promise<GroupResult | null> {
  const group = await publicClient.readContract({
    address:      config.contractAddress,
    abi:          KYRA_VAULT_ABI,
    functionName: "getGroup",
    args:         [groupId],
  });
  const [members, amount, , nextCollection, , active] = group;

  if (!active) {
    logger.debug({ groupId: groupId.toString() }, "Group inactive — skipping");
    return null;
  }

  const result: GroupResult = { groupId, collected: false, released: false };

  // ── Collect ───────────────────────────────────────────────────────────────
  if (now >= nextCollection) {
    const tx = await sendTx(groupId, "collect");
    if (tx.error) {
      result.error = tx.error;
      // Notify members that need to onramp (those with insufficient balance)
      for (const m of members) {
        const email = memberEmail(m);
        if (email) {
          await notifyOnrampNeeded({
            to:            email,
            memberAddress: m,
            groupName:     `Group ${groupId}`,
            amountNeeded:  Number(formatUnits(amount, 18)),
          }).catch(() => {});
        }
      }
      return result;
    }

    result.collected = true;
    result.collectTx = tx.hash;

    // Parse individual Collected / CollectionFailed events from receipt
    if (tx.hash) {
      const receipt = await publicClient.getTransactionReceipt({ hash: tx.hash });
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: KYRA_VAULT_ABI, data: log.data, topics: log.topics });

          if (decoded.eventName === "Collected") {
            const { member, amount: amt } = decoded.args as { member: string; amount: bigint };
            const email = memberEmail(member);
            if (email) {
              notifyCollection({
                to:            email,
                memberAddress: member,
                groupName:     `Group ${groupId}`,
                amount:        Number(formatUnits(amt, 18)),
                round:         1,       // TODO: read from group state
                totalMembers:  members.length,
                txHash:        tx.hash!,
              }).catch(() => {});
            }
          }

          if (decoded.eventName === "CollectionFailed") {
            const { member } = decoded.args as { member: string };
            const email      = memberEmail(member);
            const score      = await publicClient.readContract({
              address:      config.contractAddress,
              abi:          KYRA_VAULT_ABI,
              functionName: "getTrustScore",
              args:         [member as `0x${string}`],
            });
            if (email) {
              notifyCollectionFailed({
                to:            email,
                memberAddress: member,
                groupName:     `Group ${groupId}`,
                amount:        Number(formatUnits(amount, 18)),
                trustScore:    Number(score),
              }).catch(() => {});
            }
            // Also suggest onramp
            if (email) {
              notifyOnrampNeeded({
                to:            email,
                memberAddress: member,
                groupName:     `Group ${groupId}`,
                amountNeeded:  Number(formatUnits(amount, 18)),
              }).catch(() => {});
            }
          }
        } catch { /* not a matching log */ }
      }
    }
  }

  // ── Release ───────────────────────────────────────────────────────────────
  // Re-read group after collect to get updated pendingRelease
  const updated = await publicClient.readContract({
    address:      config.contractAddress,
    abi:          KYRA_VAULT_ABI,
    functionName: "getGroup",
    args:         [groupId],
  });
  const [, , , , , , updatedPending] = updated;

  if (updatedPending > 0n) {
    const tx = await sendTx(groupId, "release");
    if (tx.error) {
      result.error = tx.error;
      return result;
    }

    result.released  = true;
    result.releaseTx = tx.hash;
    result.potTotal  = tx.potTotal;
    result.recipient = tx.recipient;

    // Email the pot recipient
    if (tx.hash && tx.recipient && tx.potTotal !== undefined) {
      const email = memberEmail(tx.recipient);
      if (email) {
        const principal = Number(formatUnits(amount * BigInt(members.length), 18));
        const total     = Number(formatUnits(tx.potTotal, 18));
        const yld       = tx.yield !== undefined ? Number(formatUnits(tx.yield, 18)) : total - principal;
        notifyPotReceived({
          to:            email,
          memberAddress: tx.recipient,
          groupName:     `Group ${groupId}`,
          principal,
          yield:         Math.max(0, yld),
          total,
          txHash:        tx.hash!,
        }).catch(() => {});
      }
    }
  }

  return result.collected || result.released ? result : null;
}

// ── Simulate + broadcast ──────────────────────────────────────────────────────

async function sendTx(
  groupId: bigint,
  fn: "collect" | "release"
): Promise<{
  hash?:      `0x${string}`;
  potTotal?:  bigint;
  yield?:     bigint;
  recipient?: string;
  error?:     string;
}> {
  // Simulate first — catches reverts before spending gas
  try {
    await publicClient.simulateContract({
      address:      config.contractAddress,
      abi:          KYRA_VAULT_ABI,
      functionName: fn,
      args:         [groupId],
      account:      account.address,
    });
  } catch (simErr: unknown) {
    const msg = simErr instanceof Error ? simErr.message : String(simErr);
    logger.warn({ groupId: groupId.toString(), fn, error: msg }, "Simulation failed — skipping");
    return { error: `${fn} sim: ${msg}` };
  }

  try {
    const hash = await walletClient.writeContract({
      address:      config.contractAddress,
      abi:          KYRA_VAULT_ABI,
      functionName: fn,
      args:         [groupId],
      account,
    });

    logger.info({ groupId: groupId.toString(), fn, hash }, "tx submitted");

    const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

    if (receipt.status !== "success") {
      return { hash, error: "tx reverted on-chain" };
    }

    // Parse PotReleased from release receipt
    let potTotal:  bigint | undefined;
    let yld:       bigint | undefined;
    let recipient: string | undefined;

    if (fn === "release") {
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: KYRA_VAULT_ABI, data: log.data, topics: log.topics });
          if (decoded.eventName === "PotReleased") {
            const args = decoded.args as { recipient: string; total: bigint; yield: bigint };
            potTotal  = args.total;
            yld       = args.yield;
            recipient = args.recipient;
          }
        } catch { /* not a matching log */ }
      }
    }

    return { hash, potTotal, yield: yld, recipient };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ groupId: groupId.toString(), fn, error: msg }, "tx failed");
    return { error: msg };
  }
}
