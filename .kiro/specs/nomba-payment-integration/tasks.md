# Implementation Plan: Nomba Payment Integration

## Overview

14 task groups implementing the full Nomba payment lifecycle for KYRA: virtual account collections, webhook confirmation, transfer payouts, real-time UI polling, reconciliation dashboard, and payment method registration. Work top-to-bottom — each group builds on the previous.

## Tasks

- [x] 1. Webhook hardening — signature header + idempotency
  - [x] 1.1 Set `NOMBA_WEBHOOK_SECRET=NombaHackathon2026` in `.env.local`
  - [x] 1.2 Fix webhook route: change header lookup from `x-nomba-signature` → `nomba-signature` (already done)
  - [x] 1.3 Add `processedWebhookRefs: Set<string>` to `store.ts`
  - [x] 1.4 Update `markVirtualAccountPaid`: check set before writing, add ref to set after
  - [x] 1.5 Update `updatePayoutStatus`: check set before writing, add ref to set after
  - [x] 1.6 Update webhook route to pass ref into store helpers for deduplication

- [x] 2. Bank list + payment method API
  - [x] 2.1 Create `src/lib/banks.ts` with 25 Nigerian banks (codes + names)
  - [x] 2.2 Create `GET /api/banks` route returning the bank list
  - [x] 2.3 Create `POST /api/account/payment-method` route calling `store.upsertPaymentMethod`
  - [x] 2.4 Create `GET /api/account/payment-method` route returning the current payment method

- [x] 3. New store helpers
  - [x] 3.1 Add `listAllVirtualAccounts()` to `store.ts`
  - [x] 3.2 Add `listAllPayoutRecords()` to `store.ts`

- [x] 4. Status polling endpoint
  - [x] 4.1 Create `GET /api/payments/status` returning all virtual accounts, payout records, and `lastUpdated`

- [x] 5. Reconciliation endpoint
  - [x] 5.1 Create `GET /api/payments/reconciliation` grouping collections + payouts by group + round
  - [x] 5.2 Include `allPaid` (all VAs for round have `paidAt`), `potTotal` in NGN per cycle

- [x] 6. Payout retry logic
  - [x] 6.1 Update `POST /api/payments/payout`: if existing record status is `failed`, reset to `pending` and re-call Nomba Transfer with the same reference
  - [x] 6.2 Add `resetPayoutForRetry(reference)` helper to store

- [x] 7. `usePaymentStatus` hook
  - [-] 7.1 Create `src/hooks/usePaymentStatus.ts`
  - [x] 7.2 Poll `GET /api/payments/status` every 4s via `setTimeout`
  - [x] 7.3 Return `{ virtualAccounts, payoutRecords, lastUpdated, loading }`
  - [x] 7.4 Clean up timeout on unmount

- [x] 8. `<CollectionCard />` component
  - [x] 8.1 Create `src/components/app/CollectionCard.tsx`
  - [x] 8.2 Paid state: member name, green badge, bank + account number
  - [x] 8.3 Pending state: account number, bank, amount in NGN, copy button, reference truncated
  - [x] 8.4 Animate status change pending → paid with `framer-motion`

- [x] 9. `<PayoutCard />` component
  - [x] 9.1 Create `src/components/app/PayoutCard.tsx`
  - [x] 9.2 Success: recipient, NGN amount, session ID, confirmed timestamp
  - [x] 9.3 Failed: recipient, amount, **Retry Payout** button with loading + error state
  - [x] 9.4 Pending: recipient, amount, spinner

- [x] 10. `<ReconciliationPanel />` component
  - [x] 10.1 Create `src/components/app/ReconciliationPanel.tsx`
  - [x] 10.2 Fetch `GET /api/payments/reconciliation` on mount, re-poll every 4s
  - [x] 10.3 Per-cycle section: collections table using `<CollectionCard />` + `<PayoutCard />`
  - [x] 10.4 "Send Payout" button when `allPaid === true` and no payout record — calls `POST /api/payments/payout`
  - [x] 10.5 Empty state for when no cycles have run yet

- [x] 11. `<PaymentMethodForm />` component
  - [x] 11.1 Create `src/components/app/PaymentMethodForm.tsx`
  - [x] 11.2 Bank dropdown from `GET /api/banks`
  - [x] 11.3 Account number + account name inputs
  - [x] 11.4 Pre-fill from `GET /api/account/payment-method` on mount
  - [x] 11.5 Submit → `POST /api/account/payment-method` → success toast

- [x] 12. Wire components into existing pages
  - [x] 12.1 Groups page — use `usePaymentStatus`, show `<CollectionCard />` per member for groups in `collecting` status
  - [x] 12.2 Automation page — add `<ReconciliationPanel />` below worker logs
  - [x] 12.3 Account page — add `<PaymentMethodForm />` in a "Payment Method" section

- [x] 13. Replace `TransactionFeed` fake data with real activity polling
  - [x] 13.1 Remove `setInterval` fake loop from `TransactionFeed.tsx`
  - [x] 13.2 Add `useEffect` fetching `GET /api/activity` every 5s
  - [x] 13.3 Map `ActivityItem[]` to `Tx` display shape
  - [x] 13.4 Keep `AnimatePresence` animation — driven by real data

- [ ] 14. End-to-end smoke tests
  - [x] 14.1 Create group via UI, call `POST /api/payments/collect` for each member — verify virtual accounts returned
  - [x] 14.2 POST fake `virtualaccount.credit` webhook via curl — verify `paidAt` set and activity logged
  - [x] 14.3 POST same webhook again — verify no duplicate activity entry (idempotency)
  - [x] 14.4 Call `POST /api/payments/payout` — verify `PayoutRecord { status: "pending" }` persisted before Nomba responds
  - [~] 14.5 POST `payout.success` webhook — verify record status → `success`, session ID recorded
  - [~] 14.6 POST `payout.failed` webhook — verify retry button appears in reconciliation panel
  - [~] 14.7 Poll `GET /api/payments/status` — verify changes appear within 5s in browser
  - [~] 14.8 Verify `GET /api/payments/reconciliation` returns correct grouped data

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2", "3"] },
    { "wave": 2, "tasks": ["4", "5", "6"] },
    { "wave": 3, "tasks": ["7", "11"] },
    { "wave": 4, "tasks": ["8", "9", "10"] },
    { "wave": 5, "tasks": ["12", "13"] },
    { "wave": 6, "tasks": ["14"] }
  ]
}
```

## Notes

- The in-memory store is intentional. All interfaces are designed to be swapped for a real database with no changes to the route handlers.
- Nomba's sandbox does not send real webhooks — use curl to simulate them locally during smoke tests.
- The `processedWebhookRefs` Set resets on server restart in dev (hot reload). This is acceptable for  purposes; in production it would live in Redis.
- All amounts displayed in the UI use NGN (÷ 100 from kobo). All Nomba API calls use kobo (× 100 from NGN).
