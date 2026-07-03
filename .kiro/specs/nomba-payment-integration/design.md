# Design Document

## Overview

The Nomba integration adds a real payment layer to KYRA's savings circle flow. Collections use Nomba Virtual Accounts (members pay by bank transfer). Payouts use Nomba Transfers (funds sent to winners' bank accounts). Webhooks drive all state transitions. A polling hook and reconciliation dashboard provide real-time visibility.

## Architecture

```
Browser (Next.js client)
    │
    ├── poll GET /api/payments/status every 4s       (usePaymentStatus hook ✓)
    ├── poll GET /api/payments/reconciliation every 4s (ReconciliationPanel — pending)
    ├── poll GET /api/activity every 5s              (TransactionFeed — pending)
    ├── POST /api/payments/collect                   (route ✓)
    ├── POST /api/payments/payout                    (route ✓)
    └── GET  /api/payments/reconciliation            (route ✓)
            │
            ▼
    Next.js Route Handlers (server)
            │
            ├── src/lib/nomba/client.ts ──────────► Nomba REST API
            │     OAuth token cache  ✓               sandbox.nomba.com/v1
            │     createVirtualAccount() ✓
            │     sendTransfer() ✓
            │     verifyWebhookSignature() ✓
            │
            └── src/lib/backend/store.ts ─────────► In-memory store ✓
                  virtualAccounts[]
                  payoutRecords[]
                  paymentMethods[]
                  activities[]
                  processedWebhookRefs (Set)

Nomba ──────────► POST /api/webhooks/nomba ✓
                    verify nomba-signature ✓
                    check idempotency set ✓
                    route event ✓
                    update store ✓
```

## Implementation Status

| Layer | Item | Status |
|---|---|---|
| API | `POST /api/payments/collect` | ✅ Done |
| API | `POST /api/payments/payout` (+ retry) | ✅ Done |
| API | `POST /api/webhooks/nomba` | ✅ Done |
| API | `GET /api/payments/status` | ✅ Done |
| API | `GET /api/payments/reconciliation` | ✅ Done |
| API | `GET /api/banks` | ✅ Done |
| API | `GET/POST /api/account/payment-method` | ✅ Done |
| Store | All helpers including idempotency set | ✅ Done |
| Hook | `usePaymentStatus` | ✅ Done |
| Component | `<CollectionCard />` | ✅ Done |
| Component | `<PayoutCard />` | ✅ Done |
| Component | `<ReconciliationPanel />` | ⬜ Pending (task 10) |
| Component | `<PaymentMethodForm />` | ⬜ Pending (task 11) |
| Page | Groups — wire `CollectionCard` per collecting group | ⬜ Pending (task 12.1) |
| Page | Automation — add `ReconciliationPanel` | ⬜ Pending (task 12.2) |
| Page | Account — add `PaymentMethodForm` | ⬜ Pending (task 12.3) |
| Component | `TransactionFeed` — replace fake loop with real poll | ⬜ Pending (task 13) |

## Full Payment Cycle

**Phase 1 — Collection:**
1. Automation detects cycle is due
2. `POST /api/payments/collect` per member → Nomba creates virtual account
3. Member sees account number in `<CollectionCard />` in Groups page, transfers money

**Phase 2 — Confirmation:**
4. Nomba fires `virtualaccount.credit` webhook → signature verified, idempotency checked
5. `va.paidAt` set, activity logged, `<CollectionCard />` flips to paid on next 4s poll

**Phase 3 — Payout:**
6. `ReconciliationPanel` detects `allPaid === true`, shows **Send Payout** button
7. `POST /api/payments/payout` → `PayoutRecord { status: "pending" }` saved → Nomba Transfer called

**Phase 4 — Transfer confirmed:**
8. Nomba fires `payout.success` → record updated to `success`, activity logged
9. `<PayoutCard />` shows confirmed badge + session ID on next 4s poll

## Components and Interfaces

### API Routes (all implemented)

**`GET /api/payments/status`**
```ts
{
  virtualAccounts: CollectionVirtualAccount[];
  payoutRecords: PayoutRecord[];
  lastUpdated: string; // ISO
}
```

**`GET /api/payments/reconciliation`**
```ts
{
  cycles: Array<{
    groupId: string;
    groupName: string;
    round: number;
    collections: CollectionVirtualAccount[];
    payout: PayoutRecord | null;
    allPaid: boolean;
    potTotal: number; // NGN
  }>
}
```

**`GET /api/banks`**
```ts
{ banks: Array<{ code: string; name: string }> }
```

**`POST /api/account/payment-method`**
```ts
// Body
{ memberId: string; accountNumber: string; bankCode: string; accountName: string }
// Response
{ paymentMethod: PaymentMethod }
```

**`GET /api/account/payment-method`**
```ts
{ paymentMethod: PaymentMethod | null }
```

### Components (built ✅)

**`<CollectionCard />`** — `src/components/app/CollectionCard.tsx`
- Props: `va: CollectionVirtualAccount`, `memberName: string`, `amountNgn: number`
- Paid state: green badge, bank + account number, confirmed timestamp
- Pending state: account number, bank name, amount due, copy-to-clipboard, reference
- Animated with `framer-motion` — spring transition on status change

**`<PayoutCard />`** — `src/components/app/PayoutCard.tsx`
- Props: `record: PayoutRecord`, `memberName: string`, `groupName: string`, `onRetry: () => void`
- Success: green badge, recipient, NGN amount, Nomba session ID
- Failed: red badge, recipient, amount, **Retry Payout** button with loading state
- Pending: gold badge, recipient, amount, rotating spinner

### Components (pending ⬜)

**`<ReconciliationPanel />`** — `src/components/app/ReconciliationPanel.tsx`
- Polls `GET /api/payments/reconciliation` every 4s via `setTimeout`
- Per-cycle sections: heading with group + round, grid of `<CollectionCard />`, then `<PayoutCard />` or **Send Payout** button
- **Send Payout** appears when `cycle.allPaid && !cycle.payout` — calls `POST /api/payments/payout`
- Empty state when `cycles` is empty
- `onRetry` passed to each `<PayoutCard />` triggers a fresh payout POST

**`<PaymentMethodForm />`** — `src/components/app/PaymentMethodForm.tsx`
- Fetches `GET /api/banks` to populate bank `<select>`
- Pre-fills from `GET /api/account/payment-method` on mount
- Submits to `POST /api/account/payment-method`
- Success toast on `200`, inline error on failure
- Submit button disabled during request

### Hook (built ✅)

**`usePaymentStatus`** — `src/hooks/usePaymentStatus.ts`
```ts
function usePaymentStatus(intervalMs?: number): {
  virtualAccounts: CollectionVirtualAccount[];
  payoutRecords: PayoutRecord[];
  lastUpdated: string | null;
  loading: boolean;
}
```
- Polls every 4s via `setTimeout` (not `setInterval`)
- Cleans up via `mountedRef` + `clearTimeout` on unmount

## Data Models

### Idempotency reference formats

| Operation | Format | Example |
|---|---|---|
| Virtual account | `<groupId>:<round>:<memberId>` | `grp_family:4:mem_maria` |
| Payout | `payout:<groupId>:<round>` | `payout:grp_family:4` |

### Store helpers

```ts
// Idempotency
isWebhookProcessed(ref: string): boolean
markWebhookProcessed(ref: string): void

// Virtual accounts
saveVirtualAccount(va): CollectionVirtualAccount
getVirtualAccountByReference(ref): CollectionVirtualAccount | undefined
listVirtualAccountsForGroup(groupId): CollectionVirtualAccount[]
listAllVirtualAccounts(): CollectionVirtualAccount[]
markVirtualAccountPaid(ref, paidAt): CollectionVirtualAccount | undefined

// Payout records
savePayoutRecord(record): PayoutRecord
getPayoutRecord(ref): PayoutRecord | undefined
listAllPayoutRecords(): PayoutRecord[]
resetPayoutForRetry(ref): PayoutRecord | undefined
updatePayoutStatus(ref, status, sessionId?): PayoutRecord | undefined

// Payment methods
getPaymentMethod(memberId): PaymentMethod | undefined
upsertPaymentMethod(method): PaymentMethod
```

### Nigerian banks

`src/lib/banks.ts` — 25 banks including GTBank, Zenith, UBA, Access, First Bank, Kuda, Opay, Moniepoint, PalmPay.

## Correctness Properties

### Property 1: Idempotency
Every Nomba operation uses a deterministic reference. Re-calling always returns the same result with no side effects.
**Validates:** REQ-COL-2, REQ-PAY-3

### Property 2: Crash Safety
`PayoutRecord { status: "pending" }` is written before the Nomba call. A server crash mid-transfer leaves a visible, retryable record.
**Validates:** REQ-PAY-4

### Property 3: Webhook Deduplication
`processedWebhookRefs` Set prevents duplicate activity entries from Nomba retries.
**Validates:** REQ-WHK-3

### Property 4: No Phantom Credits
Contributions are only marked paid via a verified webhook — never by the collect endpoint itself.
**Validates:** REQ-COL-4

### Property 5: Retry Safety
A payout retry reuses the same Nomba reference, making multiple calls safe — Nomba never double-disburses.
**Validates:** REQ-PAY-7

## Error Handling

| Scenario | Behaviour |
|---|---|
| Nomba API error | `502 { error, detail }`, logged server-side |
| Missing payment method | `422` before any Nomba call |
| Invalid webhook signature | `401`, no state change, not logged |
| Failed payout | Record → `failed`, retry button shown in reconciliation |
| VA creation fails for one member | Error logged, remaining members still attempted |
| UI API call fails | Toast shown, no crash (REQ-ERR-2) |

## Testing Strategy

Manual smoke tests via curl (task 14). Key scenarios:

1. Collect → verify virtual accounts returned
2. `virtualaccount.credit` webhook → verify `paidAt` set + activity logged
3. Same webhook again → verify no duplicate (idempotency)
4. Payout call → verify `pending` record exists before Nomba responds
5. `payout.success` → verify `success` + session ID
6. `payout.failed` → verify retry button in UI
7. Live poll → verify UI reflects webhook within 5s
8. Reconciliation endpoint → verify grouped structure
