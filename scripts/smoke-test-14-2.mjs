/**
 * Smoke test for task 14.2
 *
 * Verifies end-to-end that a `virtualaccount.credit` webhook correctly:
 *   1. Sets `paidAt` on the virtual account in the store.
 *   2. Appends a `contribution` activity entry to the activity log.
 *
 * Requires the dev server to be running on http://localhost:3002.
 *
 * Usage:
 *   node scripts/smoke-test-14-2.mjs
 */

import { createHmac } from "crypto";

const BASE = "http://localhost:3002";
const WEBHOOK_SECRET = "NombaHackathon2026";

// Use a timestamp suffix so each run gets a fresh reference that hasn't been
// processed by the idempotency guard yet.
const RUN_ID = Date.now();

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pass(label, detail = "") {
  console.log(`  ✅ PASS  ${label}${detail ? `  —  ${detail}` : ""}`);
}

function fail(label, detail = "") {
  console.error(`  ❌ FAIL  ${label}${detail ? `  —  ${detail}` : ""}`);
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

// ─── Step 1: Seed the virtual account ────────────────────────────────────────

console.log("\n── Step 1: Seed virtual account ──────────────────────────────");
const seed = await postJson(`${BASE}/api/dev/seed-va`, VA);

if (seed.status === 201) {
  pass("Seed VA", `reference=${VA.reference}`);
} else {
  fail("Seed VA", `status=${seed.status} body=${JSON.stringify(seed.body)}`);
  process.exit(1);
}

// ─── Step 2: POST fake webhook ────────────────────────────────────────────────

console.log("\n── Step 2: POST virtualaccount.credit webhook ─────────────────");

const webhookPayload = {
  event: "virtualaccount.credit",
  data: {
    reference: VA.reference,
    accountNumber: VA.accountNumber,
    createdAt: new Date().toISOString(),
  },
};

const bodyString = JSON.stringify(webhookPayload);
const signature = createHmac("sha256", WEBHOOK_SECRET)
  .update(bodyString)
  .digest("hex");

const whRes = await fetch(`${BASE}/api/webhooks/nomba`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "nomba-signature": signature,
  },
  body: bodyString,
});

const whBody = await whRes.json();

if (whRes.status === 200 && whBody.received === true) {
  pass("Webhook accepted", `status=${whRes.status}`);
} else {
  fail("Webhook accepted", `status=${whRes.status} body=${JSON.stringify(whBody)}`);
  process.exit(1);
}

// ─── Step 3: Verify paidAt is set ────────────────────────────────────────────

console.log("\n── Step 3: Verify paidAt on virtual account ───────────────────");

const statusRes = await getJson(`${BASE}/api/payments/status`);
const vas = statusRes.body.virtualAccounts ?? [];
const va = vas.find((v) => v.reference === VA.reference);

if (!va) {
  fail("VA found in status", `reference=${VA.reference} not found`);
  process.exit(1);
}

if (va.paidAt) {
  pass("paidAt is set", `paidAt=${va.paidAt}`);
} else {
  fail("paidAt is set", `paidAt is still unset — va=${JSON.stringify(va)}`);
  process.exit(1);
}

// ─── Step 4: Verify activity log entry ───────────────────────────────────────

console.log("\n── Step 4: Verify activity log entry ──────────────────────────");

const actRes = await getJson(`${BASE}/api/activity`);
const activities = actRes.body.activity ?? [];

const match = activities.find(
  (a) =>
    a.type === "contribution" &&
    (a.groupId === VA.groupId || a.memberId === VA.memberId)
);

if (match) {
  pass(
    "contribution activity entry found",
    `id=${match.id} group=${match.groupId} member=${match.memberId} occurredAt=${match.occurredAt}`
  );
} else {
  fail(
    "contribution activity entry found",
    `No matching entry in ${activities.length} activities`
  );
  process.exit(1);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log("\n══════════════════════════════════════════════════════════════");
console.log("  ALL ASSERTIONS PASSED — Task 14.2 smoke test complete ✅");
console.log("══════════════════════════════════════════════════════════════\n");
