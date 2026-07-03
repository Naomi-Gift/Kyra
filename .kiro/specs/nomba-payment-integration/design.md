# Design Document

## Overview

The Nomba integration adds a real payment layer to KYRA's savings circle flow. Collections use Nomba Virtual Accounts (members pay by bank transfer). Payouts use Nomba Transfers (funds sent to winners' bank accounts). Webhooks drive all state transitions. A polling hook and reconciliation dashboard provide real-time visibility.

## Architecture

```
Browser (Next.js client)
    │
    ├── poll GET /api/payments/status every 4s
    ├── POST /api/payments/collect
    ├── POST /api/payments/payout
    └── GET  /api/payments/reconciliation
            │
            ▼
    Next.js Route Handlers (server)
            │
            ├── src/lib/nomba/client.ts ──────────► Nomba REST API
            │     OAuth token cache                  sandbox.nomba.com/v1
            │     createVirtualAccount()
            │     sendTransfer()
            │     verifyWebhookSignature()
            │
            └── src/lib/backend/store.ts ─────────► In-memory store
                  virtualAccounts[]
                  payoutRecords[]
                  paymentMethods[]
                  activities[]
                  processedWebhookRefs (Set)

Nomba ──────────► POST /api/webhooks/nomba
                    verify nomba-signature
                    check idempotency set
                    route event
                    update store
```

### Full Payment Cycle

**Phase 1 — Collection:**
1. Automation detects cycle is due
2. `POST /api/payments/collect` per member → Nomba creates virtual account
3. Member sees account number in UI, transfers money

**Phase 2 — Confirmation:**
4. Nomba fires `virtualaccount.credit` webhook
5. Signature verified, idempotency checked, `va.paidAt` set, activity logged

**Phase 3 — Payout:**
6. All VAs for round show `paidAt` → operator triggers payout
7. `POST /api/payments/payout` → `PayoutRecord { status: "pending" }` saved → Nomba Transfer called

**Phase 4 — Transfer confirmed:**
8. Nomba fires `payout.success` → record updated to `success`, activity logged

## Components and Interfaces

### New API Routes

**`GET /api/payments/status`**
```ts
// Response — polled every 4s by client
{
  virtualAccounts: CollectionVirtualAccount[];
  payoutRecords: PayoutRecord[];
  lastUpdated: string; // ISO
}
```

**`GET /api/payments/reconciliation`**
```ts
// Response — full cycle breakdown for automation dashboard
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

### New Components

**`<CollectionCard />`** — `src/components/app/CollectionCard.tsx`
- Props: `va: CollectionVirtualAccount`, `memberName: string`, `amountNgn: number`
- Paid state: member name, green badge, bank details
- Pending state: account number, bank, amount in NGN, copy-to-clipboard button, reference

**`<PayoutCard />`** — `src/components/app/PayoutCard.tsx`
- Props: `record: PayoutRecord`, `memberName: string`, `groupName: string`, `onRetry: () => void`
- Success: recipient, amount, session ID, confirmed timestamp
- Failed: recipient, amount, red badge, **Retry Payout** button with loading state
- Pending: recipient, amount, yellow badge, spinner

**`<ReconciliationPanel />`** — `src/components/app/ReconciliationPanel.tsx`
- Fetches `GET /api/payments/reconciliation` on mount, re-polls every 4s
- Renders per-cycle sections: collections table + payout card
- "Send Payout" button when `allPaid === true` and no payout record exists
- Empty state when no cycles have been processed

**`<PaymentMethodForm />`** — `src/components/app/PaymentMethodForm.tsx`
- Bank dropdown from `GET /api/banks`
- Account number + account name fields
- Pre-fills from `GET /api/account/payment-method` on mount
- Submit → `POST /api/account/payment-method` → success toast

### New Hook

**`usePaymentStatus`** — `src/hooks/usePaymentStatus.ts`
```ts
function usePaymentStatus(): {
  virtualAccounts: CollectionVirtualAccount[];
  payoutRecords: PayoutRecord[];
  lastUpdated: string | null;
  loading: boolean;
}
```
- Polls `GET /api/payments/status` every 4s via `setTimeout` (not `setInterval`)
- Cleans up on unmount

### Modified Components

**`TransactionFeed`** — remove fake `setInterval`, replace with real `GET /api/activity` poll every 5s

## Data Models

### Store additions

```ts
// New module-level state in store.ts
const processedWebhookRefs = new Set<string>();

// New helpers
function listAllVirtualAccounts(): CollectionVirtualAccount[]
function listAllPayoutRecords(): PayoutRecord[]
```

### Idempotency reference formats

| Operation | Format | Example |
|---|---|---|
| Virtual account | `<groupId>:<round>:<memberId>` | `grp_family:4:mem_maria` |
| Payout | `payout:<groupId>:<round>` | `payout:grp_family:4` |

### Nigerian banks constant

`src/lib/banks.ts` — 25 banks including GTBank, Zenith, UBA, Access, First Bank, Kuda, Opay, Moniepoint, PalmPay.

### Environment variables

```
NOMBA_ACCOUNT_ID        = f666ef9b-888e-4799-85ce-acb505b28023
NOMBA_SUB_ACCOUNT_ID    = 8213193b-d59d-4944-b7e3-7ce3d3b18974
NOMBA_CLIENT_ID         = 706df6c4-b8bb-4130-88c4-d21b052f8631
NOMBA_CLIENT_SECRET     = k8UobYk3APgOoxUnNL7VpuxzwTsH4LsXtydfjcHs8RH0YISBB4OMqJsaafG+U8fWETu9YZ96bNXE+DelCDuMPw==
NOMBA_BASE_URL          = https://sandbox.nomba.com/v1
NOMBA_WEBHOOK_SECRET    = NombaHackathon2026
```

## Correctness Properties

### Property 1: Idempotency
Every Nomba operation uses a deterministic reference. Re-calling the same operation always returns the same result without side effects.
**Validates: Requirements REQ-COL-2, REQ-PAY-3**

### Property 2: Crash Safety
`PayoutRecord { status: "pending" }` is written before the Nomba call. If the server crashes mid-transfer, the pending record is visible and retryable.
**Validates: Requirements REQ-PAY-4**

### Property 3: Webhook Deduplication
`processedWebhookRefs` set prevents duplicate activity entries from Nomba retries.
**Validates: Requirements REQ-WHK-3**

### Property 4: No Phantom Credits
Contributions are only marked paid via webhook — never by the collect endpoint itself.
**Validates: Requirements REQ-COL-4**

### Property 5: Retry Safety
A payout retry reuses the same Nomba reference, making it safe to call Nomba multiple times without double-disbursing.
**Validates: Requirements REQ-PAY-7**

## Error Handling

- Nomba API errors → `502 { error, detail }`, logged server-side
- Missing payment method → `422` before any Nomba call is made
- Failed payout → record status `failed`, surfaced in reconciliation with retry button
- Webhook signature failure → `401`, not logged as activity
- Virtual account creation failure for one member → logged, other members still attempted

## Testing Strategy

Manual smoke tests via curl (see tasks 14.1–14.8):
1. Create group → call collect for each member → verify VAs returned
2. POST fake `virtualaccount.credit` webhook → verify activity log updates, `paidAt` set
3. POST same webhook again → verify no duplicate activity entry
4. Call payout → verify `PayoutRecord { status: "pending" }` exists before Nomba responds
5. POST `payout.success` webhook → verify status → `success`, session ID recorded
6. POST `payout.failed` webhook → verify retry button appears in UI
7. Poll `/api/payments/status` → verify changes reflect within 5s
