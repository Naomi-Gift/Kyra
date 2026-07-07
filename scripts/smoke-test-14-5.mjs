/**
 * Smoke test for task 14.5
 *
 * Verifies REQ-WHK-4: POST payout.success webhook MUST update the PayoutRecord
 * status to "success", record the Nomba session ID, and append a payout
 * activity log entry.
 *
 * Strategy:
 *   1. Ensure a payment method exists for the test member (idempotent upsert)
 *   2. Call POST /api/payments/payout to create a PayoutRecord in the store.
 *      The Nomba sandbox will return a 502 error, leaving the record as "failed".
 *      That is expected — the record exists in the store, which is all we need.
 *   3. POST a signed payout.success webhook with a fake sessionId embedded in
 *      event.data.accountNumber (that is the field the route uses for sessionId)
 *   4. Assert the PayoutRecord status === "success" and nombaSessionId is set
 *   5. Assert a payout activity entry was appended for this payout
 *
 * Unique round per run (timestamp-derived) prevents collisions with prior runs
 * stored in the in-memory store during the same server session.
 *
 * Requires the dev server to be running on http://localhost:3002.
 *
 * Usage:
 *   node scripts/smoke-test-14-5.mjs
 */

import { createHmac } from "crypto";

const BASE = "http://localhost:3002";
const WEBHOOK_SECRET = "NombaHackathon2026";

// Unique round per run to avoid idempotency collisions within the same session
const ROUND = 2000 + (Date.now() % 9000); // e.g. 5843

const GROUP_ID = "grp_family";
const MEMBER_ID = "mem_maria";
const AMOUNT_NGN = 125; // ₦25 × 5 members

const PAYOUT_REFERENCE = `payout:${GROUP_ID}:${ROUND}`;

// Fake Nomba session ID we expect to find in the record after the webhook fires
const FAKE_SESSION_ID = `NMB-SESSION-${Date.now()}`;

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
  let responseBody;
  try {
    responseBody = await res.json();
  } catch {
    responseBody = { _raw: await res.text() };
  }
  return { status: res.status, body: responseBody };
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

// ─── Step 1: Ensure payment method exists ────────────────────────────────────

console.log("\n── Step 1: Ensure payment method exists for mem_maria ─────────");

const pmBody = {
  memberId: MEMBER_ID,
  accountNumber: "0123456789",
  bankCode: "058",
  accountName: "Maria S.",
};

const pmRes = await postJson(`${BASE}/api/account/payment-method`, pmBody);

if (pmRes.status === 200 || pmRes.status === 201) {
  pass("Payment method upserted", `memberId=${MEMBER_ID} bank=GTBank acc=${pmBody.accountNumber}`);
} else {
  fail("Payment method upsert", `status=${pmRes.status} body=${JSON.stringify(pmRes.body)}`);
  console.error("  Cannot proceed without a payment method — aborting.");
  process.exit(1);
}

// ─── Step 2: Create a PayoutRecord via POST /api/payments/payout ─────────────
// The Nomba sandbox will likely fail (502), leaving the record as "failed".
// Either way, the record will exist in the store — that is all we need here.
// The webhook in the next step will update it to "success".

console.log(`\n── Step 2: Create PayoutRecord via POST /api/payments/payout ───`);
console.log(`     reference: ${PAYOUT_REFERENCE}`);
console.log(`     group: ${GROUP_ID}  member: ${MEMBER_ID}  amount: ₦${AMOUNT_NGN}`);

const payoutRes = await postJson(`${BASE}/api/payments/payout`, {
  groupId: GROUP_ID,
  memberId: MEMBER_ID,
  round: ROUND,
  amountNgn: AMOUNT_NGN,
});

// Accept 201 (Nomba succeeded, record status may be "success"/"pending"),
// or 502 (Nomba sandbox error, record status should be "failed" in store).
// In both cases the record MUST now exist in the store.
const ACCEPTABLE_PAYOUT_STATUSES = [200, 201, 502];

if (ACCEPTABLE_PAYOUT_STATUSES.includes(payoutRes.status)) {
  const note = payoutRes.status === 502
    ? "(Nomba sandbox error — expected in test env)"
    : "";
  pass(`Payout endpoint responded`, `HTTP ${payoutRes.status} ${note}`);
} else {
  fail("Payout endpoint", `HTTP ${payoutRes.status}: ${JSON.stringify(payoutRes.body)}`);
  if (payoutRes.status === 422) {
    console.error("  422 = no payment method found — did Step 1 succeed?");
  } else if (payoutRes.status === 404) {
    console.error("  404 = group or member not found — check GROUP_ID / MEMBER_ID.");
  }
  process.exit(1);
}

// Verify the record is now in the store (regardless of which status it landed in)
const statusBeforeWebhook = await getJson(`${BASE}/api/payments/status`);
const recordsBefore = statusBeforeWebhook.body.payoutRecords ?? [];
const recordBefore = recordsBefore.find((r) => r.reference === PAYOUT_REFERENCE);

if (!recordBefore) {
  fail(
    "PayoutRecord exists in store after payout call",
    `reference="${PAYOUT_REFERENCE}" NOT found — cannot run webhook test`
  );
  console.error("  Aborting — no record to update.");
  process.exit(1);
} else {
  pass(
    "PayoutRecord exists in store",
    `reference="${PAYOUT_REFERENCE}"  status="${recordBefore.status}"`
  );
  console.log(`     (Pre-webhook status is "${recordBefore.status}" — webhook should update this to "success")`);
}

// If payout route already returned "success" (Nomba sandbox happened to work),
// we need to verify the webhook can still be processed. But since the store's
// dedupeKey for the webhook is "payout.success:<reference>" (not the same ref
// as the payout route deduplication), this is safe to POST regardless.
// However the store idempotency guard in updatePayoutStatus checks
// isWebhookProcessed(reference) against the bare reference — meaning if the
// payout route already called markWebhookProcessed(reference) (it doesn't —
// only the webhook handler does), it would block. The payout route does NOT
// call markWebhookProcessed, so we are safe to send the webhook.

// ─── Step 3: POST payout.success webhook ─────────────────────────────────────

console.log(`\n── Step 3: POST payout.success webhook ────────────────────────`);
console.log(`     reference: ${PAYOUT_REFERENCE}`);
console.log(`     fakeSessionId (in data.accountNumber): ${FAKE_SESSION_ID}`);

// The webhook route handler stores event.data.accountNumber as nombaSessionId:
//   const record = updatePayoutStatus(reference, "success", event.data.accountNumber)
// So we embed the session ID in data.accountNumber.

const webhookPayload = {
  event: "payout.success",
  data: {
    reference: PAYOUT_REFERENCE,
    amount: AMOUNT_NGN * 100, // kobo
    accountNumber: FAKE_SESSION_ID, // used by handler as nombaSessionId
    status: "success",
    createdAt: new Date().toISOString(),
  },
};

const webhookRes = await postWebhook(webhookPayload);

if (webhookRes.status === 200 && webhookRes.body.received === true) {
  pass("Webhook accepted", `status=${webhookRes.status} received=true`);
} else {
  fail(
    "Webhook accepted",
    `status=${webhookRes.status} body=${JSON.stringify(webhookRes.body)}`
  );
  if (webhookRes.status === 401) {
    console.error("  401 = signature invalid — check WEBHOOK_SECRET matches NOMBA_WEBHOOK_SECRET");
  }
  process.exit(1);
}

// ─── Step 4: GET /api/payments/status — assert record is now "success" ────────

console.log(`\n── Step 4: Verify PayoutRecord status === "success" ────────────`);

const statusAfterWebhook = await getJson(`${BASE}/api/payments/status`);

if (statusAfterWebhook.status !== 200) {
  fail("GET /api/payments/status", `HTTP ${statusAfterWebhook.status}`);
  process.exit(1);
}

const payoutRecords = statusAfterWebhook.body.payoutRecords ?? [];
const record = payoutRecords.find((r) => r.reference === PAYOUT_REFERENCE);

if (!record) {
  fail(
    "PayoutRecord found in status",
    `reference="${PAYOUT_REFERENCE}" not found among ${payoutRecords.length} records`
  );
  process.exit(1);
} else {
  pass("PayoutRecord found", `reference="${record.reference}"`);
}

// Assert status === "success"
if (record.status === "success") {
  pass('record.status === "success"', `status="${record.status}"`);
} else {
  fail('record.status === "success"', `Got "${record.status}" — webhook may not have processed`);
}

// Assert nombaSessionId is set and matches our fake session ID
if (record.nombaSessionId === FAKE_SESSION_ID) {
  pass("nombaSessionId matches fake session ID", record.nombaSessionId);
} else if (record.nombaSessionId) {
  fail(
    "nombaSessionId matches fake session ID",
    `Expected "${FAKE_SESSION_ID}" got "${record.nombaSessionId}"`
  );
} else {
  fail("nombaSessionId is set", `nombaSessionId is absent — check updatePayoutStatus in store`);
}

// Assert other core fields are intact
if (record.groupId === GROUP_ID) {
  pass("groupId intact", record.groupId);
} else {
  fail("groupId intact", `Expected "${GROUP_ID}" got "${record.groupId}"`);
}

if (record.memberId === MEMBER_ID) {
  pass("memberId intact", record.memberId);
} else {
  fail("memberId intact", `Expected "${MEMBER_ID}" got "${record.memberId}"`);
}

if (record.round === ROUND) {
  pass("round intact", String(record.round));
} else {
  fail("round intact", `Expected ${ROUND} got ${record.round}`);
}

if (typeof record.amountKobo === "number" && record.amountKobo > 0) {
  pass("amountKobo is positive", `${record.amountKobo} kobo = ₦${record.amountKobo / 100}`);
} else {
  fail("amountKobo is positive", `Got ${JSON.stringify(record.amountKobo)}`);
}

// ─── Step 5: Verify a payout activity entry was appended ─────────────────────

console.log(`\n── Step 5: Verify payout activity entry was appended ───────────`);

const actRes = await getJson(`${BASE}/api/activity`);
const activities = actRes.body.activity ?? [];

// The store appends an activity entry with type="payout" and a description
// that includes the group name. We identify it by type + groupId + memberId
// and that occurredAt is recent (within the last 60 seconds, to isolate
// this run from older seeded activities).
const since = new Date(Date.now() - 60_000).toISOString();

const matchingActivities = activities.filter(
  (a) =>
    a.type === "payout" &&
    a.groupId === GROUP_ID &&
    a.memberId === MEMBER_ID &&
    a.occurredAt >= since
);

console.log(
  `     Found ${matchingActivities.length} recent payout activity entries for group=${GROUP_ID} member=${MEMBER_ID}`
);

if (matchingActivities.length >= 1) {
  const entry = matchingActivities[matchingActivities.length - 1];
  pass(
    "Payout activity entry appended",
    `id=${entry.id}  description="${entry.description}"  amount=₦${entry.amount}`
  );
  if (matchingActivities.length > 1) {
    console.log(`     Note: ${matchingActivities.length} entries found (could include earlier runs in this session)`);
  }
} else {
  fail(
    "Payout activity entry appended",
    `No recent payout activity for group=${GROUP_ID} member=${MEMBER_ID} since ${since}`
  );
  console.error("  Check updatePayoutStatus in store.ts — it should push a payout ActivityItem on status=success");
}

// ─── Step 6: Idempotency check — post same webhook again ─────────────────────

console.log(`\n── Step 6: Idempotency — POST same webhook again ───────────────`);

const secondWebhookRes = await postWebhook(webhookPayload);

if (secondWebhookRes.status === 200 && secondWebhookRes.body.received === true) {
  pass("Duplicate webhook returns 200 received=true", `status=${secondWebhookRes.status}`);
} else {
  fail(
    "Duplicate webhook response",
    `status=${secondWebhookRes.status} body=${JSON.stringify(secondWebhookRes.body)}`
  );
}

// Verify no duplicate activity entries were created
const actResAfterDupe = await getJson(`${BASE}/api/activity`);
const activitiesAfterDupe = actResAfterDupe.body.activity ?? [];
const matchingAfterDupe = activitiesAfterDupe.filter(
  (a) =>
    a.type === "payout" &&
    a.groupId === GROUP_ID &&
    a.memberId === MEMBER_ID &&
    a.occurredAt >= since
);

if (matchingAfterDupe.length === matchingActivities.length) {
  pass(
    "No duplicate activity entry after second webhook",
    `Count unchanged at ${matchingAfterDupe.length}`
  );
} else {
  fail(
    "No duplicate activity entry",
    `Was ${matchingActivities.length} before, now ${matchingAfterDupe.length} — idempotency guard failed`
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log("\n══════════════════════════════════════════════════════════════");
if (allPassed) {
  console.log("  ALL ASSERTIONS PASSED — Task 14.5 smoke test complete ✅");
  console.log(`  payout.success webhook correctly updated:`);
  console.log(`    • PayoutRecord status → "success"  (REQ-WHK-4)`);
  console.log(`    • nombaSessionId recorded           (REQ-WHK-4)`);
  console.log(`    • Payout activity entry appended    (REQ-AUD-1)`);
  console.log(`    • Duplicate webhook ignored         (REQ-WHK-3)`);
} else {
  console.log("  ONE OR MORE ASSERTIONS FAILED — see ❌ above ⛔");
  process.exitCode = 1;
}
console.log("══════════════════════════════════════════════════════════════\n");
