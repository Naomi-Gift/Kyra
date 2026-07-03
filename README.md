# Kyra

Automated savings circles for groups.

Kyra lets families, friends, coworkers, and community groups run rotating savings circles without spreadsheets or a coordinator chasing everyone manually. Members join a group, save a payment method, contribute on schedule, and receive the full pot when their turn arrives.

## What changed

Kyra is now a Web2 product. The old decentralized architecture has been replaced with a conventional application backend.

The app is built around:

- A Next.js frontend and backend in one codebase
- Route-handler APIs under `src/app/api`
- Typed domain models in `src/lib/backend`
- Backend-managed group scheduling, collections, payouts, activity, and settings
- Regular account and payment-method language throughout the product

## Product flow

1. A user creates a savings group with a contribution amount and cycle duration.
2. Members are invited by name or email.
3. Kyra stores each member and payment method through the backend domain model.
4. The automation worker checks due groups, records collections, queues payouts, and logs activity.
5. Members can view groups, savings growth, recent activity, account balance, payment methods, and notification settings.

## Project structure

```text
src/
  app/
    api/                    Backend route handlers
      account/
      activity/
      automation/
      dashboard/
      groups/
      settings/
    app/                    Authenticated app screens
    page.tsx                Landing page
  components/
    app/                    Dashboard components
    landing/                Marketing/product sections
    ui/                     Shared UI primitives
  lib/
    backend/                Web2 domain types and seeded store
```

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/groups` | `GET` | List savings groups |
| `/api/groups` | `POST` | Create a savings group |
| `/api/activity` | `GET` | List recent activity |
| `/api/dashboard` | `GET` | Return dashboard metrics |
| `/api/account` | `GET` | Return account summary |
| `/api/automation` | `GET` | Return worker status |
| `/api/automation` | `POST` | Queue a manual automation run |
| `/api/settings` | `GET` | Return notification settings |
| `/api/settings` | `PATCH` | Update notification settings |
| `/api/payments/collect` | `POST` | Create Nomba virtual account for a contribution |
| `/api/payments/payout` | `POST` | Send pot payout via Nomba transfer |
| `/api/webhooks/nomba` | `POST` | Receive Nomba payment event webhooks |

## Nomba integration

KYRA uses [Nomba](https://developer.nomba.com) as its payment provider for collections and payouts.

### How it works

1. **Collection** — When a member owes a contribution, `POST /api/payments/collect` creates a Nomba virtual account. The member does a bank transfer to that account number. Nomba fires a `virtualaccount.credit` webhook to `/api/webhooks/nomba`, which marks the contribution as received.
2. **Payout** — When the full pot is ready, `POST /api/payments/payout` calls the Nomba Transfer API to send funds directly to the winning member's bank account. Nomba confirms delivery via a `payout.success` webhook.
3. **Webhooks** — All Nomba events arrive at `POST /api/webhooks/nomba`. The handler verifies the HMAC-SHA256 signature before processing.

### Payment API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/payments/collect` | `POST` | Create a Nomba virtual account for a member's contribution |
| `/api/payments/payout` | `POST` | Trigger a bank transfer payout to the pot winner |
| `/api/webhooks/nomba` | `POST` | Receive and process Nomba payment event webhooks |

### Setup

1. Copy `.env.local.example` to `.env.local` and fill in your Nomba credentials.
2. In the Nomba dashboard, set the webhook URL to `https://your-domain.com/api/webhooks/nomba`.
3. Copy the webhook secret from the dashboard into `NOMBA_WEBHOOK_SECRET`.

```bash
cp .env.local.example .env.local
```

### Nomba client

The Nomba API wrapper lives in `src/lib/nomba/`:

```text
src/lib/nomba/
  client.ts   — OAuth token lifecycle, createVirtualAccount(), sendTransfer(), verifyWebhookSignature()
  types.ts    — Nomba API request/response types
```

Token management is automatic — the client issues, refreshes (5 min before expiry), and caches the OAuth token. In production with multiple server instances, move the token cache to Redis.

## Next backend steps

The current backend store is intentionally in-memory so the product can be developed quickly. For production, replace `src/lib/backend/store.ts` with:

- PostgreSQL or another durable database
- An auth provider for sessions and member invites
- Move Nomba token cache to Redis for multi-instance deployments
- A scheduled worker for recurring cycles (replace the interval-based automation)
- Audit logging for every collection, payout, and settings change
