# Requirements Document

## Introduction

KYRA is a rotating savings circle (ajo/susu) app. Every group runs in cycles: each member contributes a fixed amount per round, and one member receives the full pot. This integration replaces demo data with real Nomba bank-transfer collections and verified payout transfers, covering the full payment lifecycle.

**Hackathon track:** Bank-transfer checkout + Treasury/payouts (full cycle)

**Existing foundations:**
- `src/lib/nomba/client.ts` — OAuth token lifecycle, `createVirtualAccount()`, `sendTransfer()`, `verifyWebhookSignature()`
- `src/app/api/payments/collect` — creates Nomba virtual account per member per cycle
- `src/app/api/payments/payout` — sends pot payout via Nomba Transfer API
- `src/app/api/webhooks/nomba` — verifies signature, routes `virtualaccount.credit`, `payout.success`, `payout.failed`
- Domain types: `PaymentMethod`, `CollectionVirtualAccount`, `PayoutRecord`

## Requirements

### 1. Collection — Virtual Account per Member per Round

**REQ-COL-1** When a cycle begins, the system MUST create one Nomba virtual account for each member who owes a contribution. Each account MUST use a stable reference: `<groupId>:<round>:<memberId>`.

**REQ-COL-2** Virtual account creation MUST be idempotent. The same `groupId + round + memberId` MUST always return the same virtual account without creating a duplicate on Nomba.

**REQ-COL-3** Each virtual account MUST be shown to the member in the UI: account number, bank name, amount owed, and status (`pending` / `paid`).

**REQ-COL-4** Contributions MUST only be marked paid via a verified Nomba webhook event. No other mechanism is valid.

### 2. Webhook Handling

**REQ-WHK-1** The webhook endpoint MUST verify HMAC-SHA256 signatures on every request using the `nomba-signature` header and key `NombaHackathon2026`. Requests with invalid or missing signatures MUST return `401`.

**REQ-WHK-2** On `virtualaccount.credit`: mark the matching virtual account as paid, append an activity log entry, return `200`.

**REQ-WHK-3** Webhook events MUST be idempotent. Processing the same reference twice MUST NOT create duplicate activity entries or double-count contributions.

**REQ-WHK-4** On `payout.success`: update the `PayoutRecord` status to `success`, record the Nomba session ID, append a payout activity log entry.

**REQ-WHK-5** On `payout.failed`: update the `PayoutRecord` status to `failed`, surface the failure in the reconciliation dashboard.

**REQ-WHK-6** The webhook handler MUST return `200` for all recognised and unrecognised events. Only signature failures return non-200.

### 3. Payout — Transfer to Winning Member

**REQ-PAY-1** When all members in a round have paid, the system MUST be able to trigger a payout to `nextPayoutMemberId` via `POST /api/payments/payout`.

**REQ-PAY-2** Payouts MUST use the Nomba Transfer API, sending the full pot amount (`amount × memberCount`) in kobo.

**REQ-PAY-3** Payout MUST be idempotent. Reference `payout:<groupId>:<round>` is the Nomba idempotency key.

**REQ-PAY-4** A `PayoutRecord` with status `pending` MUST be saved BEFORE calling Nomba, preventing unknown state on crash.

**REQ-PAY-5** Transfer errors MUST set the record to `failed` and return `502` with details. Errors MUST NOT be silently swallowed.

**REQ-PAY-6** If no `PaymentMethod` exists for the winning member, the API MUST return `422`.

**REQ-PAY-7** Failed payouts MUST be retryable. A retry MUST reuse the same Nomba reference (idempotent on Nomba's side) and only proceed if the existing record has status `failed`.

### 4. Payment Method Registration

**REQ-PM-1** Members MUST be able to save a bank account (account number, bank code, account name) via the UI.

**REQ-PM-2** One payment method per member, upsert behaviour.

**REQ-PM-3** A dropdown of Nigerian banks with codes MUST be available in the form.

### 5. Real-Time UI Updates

**REQ-RT-1** Payment status changes MUST be reflected in the UI within 5 seconds of a webhook being received, without a full page reload.

**REQ-RT-2** Client-side polling against `GET /api/payments/status` at a 4-second interval is the required mechanism.

**REQ-RT-3** When `virtualaccount.credit` fires, the member's status in the groups UI MUST update from `pending` → `paid` on the next poll.

**REQ-RT-4** When `payout.success` fires, the payout card MUST update to show `Confirmed` with the session ID on the next poll.

### 6. Reconciliation Dashboard

**REQ-REC-1** The automation page MUST include a reconciliation panel listing every `CollectionVirtualAccount` and `PayoutRecord` for each cycle.

**REQ-REC-2** Collection rows MUST show: member name, group, round, Nomba reference, account number, bank, status, paid-at timestamp.

**REQ-REC-3** Payout rows MUST show: recipient, group, round, Nomba reference, amount (NGN), status, session ID, created timestamp.

**REQ-REC-4** Failed payouts MUST show a **Retry** button. The retry MUST be idempotent.

**REQ-REC-5** A `GET /api/payments/reconciliation` endpoint MUST return collections and payouts grouped by group and round.

### 7. Audit Log

**REQ-AUD-1** Every state transition MUST be recorded as an `ActivityItem` with timestamp and Nomba reference.

**REQ-AUD-2** The activity log MUST be append-only.

### 8. Error Handling

**REQ-ERR-1** All Nomba API errors MUST be caught, logged server-side, and returned as `502 { error, detail }`.

**REQ-ERR-2** The UI MUST display a user-facing error (toast or inline) when API calls fail, without crashing.

**REQ-ERR-3** If virtual account creation fails for one member, remaining members MUST still be attempted.

### 9. Security

**REQ-SEC-1** All credentials MUST be in environment variables only, never in source code or exposed client-side.

**REQ-SEC-2** Parent account ID goes in the `accountId` header. Sub-account ID scopes virtual accounts and transfers in the request body.

**REQ-SEC-3** `NOMBA_BASE_URL` controls sandbox vs. production. TEST credentials → `https://sandbox.nomba.com/v1`.

## Glossary

- **Ajo/Susu** — a rotating savings circle common in West Africa. Members contribute a fixed amount each cycle; one member receives the full pot per round.
- **Virtual Account** — a unique Nigerian bank account number issued by Nomba, tied to a specific collection reference.
- **Round** — one cycle iteration within a group. Each round has one winner (the `nextPayoutMemberId`).
- **Pot** — the total collected amount: `contribution amount × member count`.
- **Kobo** — the smallest Nigerian currency unit. 100 kobo = ₦1 NGN. Nomba amounts are in kobo.
- **Reference** — a stable, deterministic string used as an idempotency key for every Nomba operation.
