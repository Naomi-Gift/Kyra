/**
 * Smoke test for task 14.3
 *
 * Verifies idempotency: posting the same `virtualaccount.credit` webhook twice
 * MUST NOT create a duplicate activity entry. The activity log must contain
 * exactly one contribution entry for that reference after two POST attempts.
 *
 * Requires the dev server to be running on http://localhost:3002.
 *
 * Usage:
 *   node scripts/smoke-test-14-3.mjs
 */

import { createHmac } from "crypto";

const BASE = "http://localhost:3002";
const WEBHOOK_SECRET = "NombaHackathon2026";

// Use a fixed, deterministic run ID so both webhook posts use the exact same
// reference — proving the deduplication works.
const RUN_ID = `idem-${Date.now()}`;

const VA = {
  reference: `grp_city:1:mem_aisha:${RUN_ID}`,
  accountNumber: "1234567890",
  bank: "GTBank",
  bankCode: "058",
  groupId: "grp_city",
  memberId: "mem_aisha",
  round: 1,
  amountKobo: 10000,
};

let allPassed = true;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pass(label, detail = "") {
  console.log(`  ✅ PASS  ${label}${detail ? `  —  ${detail}` : ""}`);
}

function fail(label, detail = "") {
  console.error(`  ❌ FAIL  ${label}${detail ? `  —  ${detail}` : ""}`);
  allPassed = false;
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function getJson(url) {
  const res = await fetch(url);
  return { status: res.status, body: await res.json() };
}

function buildSignedWebhookRequest(payload) {
  const bodyString = JSON.stringify(payload);
  const signature = createHmac("sha256", WEBHOOK_SECRET)
    .update(bodyString)
    .digest("hex");
  return { bodyString, signature };
}

async function postWebhook(payload) {
  const { bodyString, signature } = buildSignedWebhookRequest(payload);
  const res = await fetch(`${BASE}/api/webhooks/nomba`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "nomba-signature": signature,
    },
    body: bodyString,
  });
  return { status: res.status, body: await res.json() };
}

// ─── Step 1: Seed the virtual account ────────────────────────────────────────

console.log("\n── Step 1: Seed virtual account ──────────────────────────────");
const seed = await postJson(`${BASE}/api/dev/seed-va`, VA);

if (seed.status === 201) {
  pass("Seed VA", `reference=${VA.reference}`);
} else {
  fail("Seed VA", `status=${seed.status} body=${JSON.stringify(seed.body)}`);
  process.exit(1);
}

// ─── Step 2: POST webhook — first delivery ────────────────────────────────────

console.log("\n── Step 2: POST virtualaccount.credit webhook (1st time) ──────");

const webhookPayload = {
  event: "virtualaccount.credit",
  data: {
    reference: VA.reference,
    accountNumber: VA.accountNumber,
    createdAt: new Date().toISOString(),
  },
};

const first = await postWebhook(webhookPayload);

if (first.status === 200 && first.body.received === true) {
  pass("First webhook accepted", `status=${first.status}`);
} else {
  fail("First webhook accepted", `status=${first.status} body=${JSON.stringify(first.body)}`);
  process.exit(1);
}

// ─── Step 3: POST the SAME webhook again ─────────────────────────────────────

console.log("\n── Step 3: POST same webhook a second time (duplicate) ─────────");

const second = await postWebhook(webhookPayload);

if (second.status === 200 && second.body.received === true) {
  pass("Second webhook also returns 200 received=true", `status=${second.status}`);
} else {
  fail("Second webhook response", `status=${second.status} body=${JSON.stringify(second.body)}`);
}

// ─── Step 4: Verify activity log has exactly 1 entry ─────────────────────────

console.log("\n── Step 4: Verify exactly 1 activity entry for this reference ──");

// Fetch the VA to get the exact paidAt timestamp set by the first webhook.
// We use paidAt as a precise anchor so we only count entries from THIS run,
// not from prior test runs that left entries for the same group+member combo.
const statusForCheck = await getJson(`${BASE}/api/payments/status`);
const vaForCheck = (statusForCheck.body.virtualAccounts ?? []).find(
  (v) => v.reference === VA.reference
);
const paidAtTimestamp = vaForCheck?.paidAt;

const actRes = await getJson(`${BASE}/api/activity`);
const activities = actRes.body.activity ?? [];

// Count entries that match the contribution written by the first webhook:
// same group+member+type+description AND the same occurredAt as paidAt.
// This isolates this run's entry from any leftover entries in prior smoke runs.
const matches = activities.filter(
  (a) =>
    a.type === "contribution" &&
    a.groupId === VA.groupId &&
    a.memberId === VA.memberId &&
    a.description === "Contribution recorded via Nomba" &&
    (paidAtTimestamp ? a.occurredAt === paidAtTimestamp : true)
);

console.log(
  `     Found ${matches.length} matching contribution entries for group=${VA.groupId} member=${VA.memberId} paidAt=${paidAtTimestamp}`
);

if (matches.length === 1) {
  pass(
    "Exactly 1 activity entry — no duplicate",
    `id=${matches[0].id} occurredAt=${matches[0].occurredAt}`
  );
} else if (matches.length === 0) {
  fail("Activity entry exists", "No contribution entry found after first webhook — check webhook processing");
} else {
  fail(
    "No duplicate activity entry",
    `Found ${matches.length} entries instead of 1 — idempotency guard is not working`
  );
  console.error("\n  Duplicate entries:");
  matches.forEach((m, i) =>
    console.error(`    [${i + 1}] id=${m.id}  occurredAt=${m.occurredAt}`)
  );
}

// ─── Step 5: Verify paidAt still set (sanity) ────────────────────────────────

console.log("\n── Step 5: Sanity — paidAt still set after duplicate ───────────");

const statusRes = await getJson(`${BASE}/api/payments/status`);
const vas = statusRes.body.virtualAccounts ?? [];
const va = vas.find((v) => v.reference === VA.reference);

if (!va) {
  fail("VA found in status", `reference=${VA.reference} not found`);
} else if (va.paidAt) {
  pass("paidAt is still set", `paidAt=${va.paidAt}`);
} else {
  fail("paidAt is still set", `paidAt is unset — something went wrong`);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log("\n══════════════════════════════════════════════════════════════");
if (allPassed) {
  console.log("  ALL ASSERTIONS PASSED — Task 14.3 smoke test complete ✅");
  console.log("  Idempotency confirmed: duplicate webhook did not create");
  console.log("  a second activity entry.");
} else {
  console.log("  ONE OR MORE ASSERTIONS FAILED — see ❌ above ⛔");
  process.exitCode = 1;
}
console.log("══════════════════════════════════════════════════════════════\n");
