# Kyra — Automated Savings Circles

> Built for the **Nomba Hackathon 2026**

Kyra is a web application that lets families, friends, and community groups run **rotating savings circles (ajo/esusu)** without spreadsheets, WhatsApp reminders, or a trusted coordinator chasing people manually. Members join a group, contribute on schedule, and receive the full pot when their turn arrives — all automated and powered by Nomba.

---

## The Problem

Rotating savings circles are one of the most widely used informal financial tools across Africa. Millions of people run them manually — over WhatsApp, in notebooks, by word of mouth. The result: missed contributions, delayed payouts, broken trust, and no financial record.

## The Solution

Kyra replaces the manual coordinator with an automated backend. Members get a virtual bank account number to pay into. Nomba confirms the payment. The pot is sent automatically to the winner's bank account when everyone has contributed. Every step is logged.

---

## Live Demo

🔗 **[kyra-naomi.vercel.app](https://kyra-naomi.vercel.app)** *(deploy URL — update after Vercel deploy)*

---

## How It Works

```
Member pays bank transfer
        │
        ▼
Nomba Virtual Account (per member, per round)
        │
        ▼  virtualaccount.credit webhook
Kyra marks contribution ✓
        │
        ▼  all members paid?
Kyra triggers payout via Nomba Transfer API
        │
        ▼  payout.success webhook
Winner receives full pot in their bank account
```

### Full Cycle

1. **Create a group** — set a contribution amount, cycle length, and add members
2. **Collection phase** — Kyra creates a unique Nomba virtual account for each member per round. Members pay by regular bank transfer to that account number
3. **Webhook confirmation** — Nomba fires `virtualaccount.credit` to `/api/webhooks/nomba`. Kyra marks the contribution paid, logs activity
4. **Payout** — once all contributions are in, Kyra calls the Nomba Transfer API to send the full pot to the winner's bank account
5. **Confirmation** — Nomba fires `payout.success`. The cycle advances to the next member

---

## Nomba Integration

Kyra is built entirely on the Nomba API:

| Feature | Nomba API |
|---|---|
| Per-member payment collection | Virtual Accounts API |
| Pot disbursement to winner | Transfer API |
| Real-time payment confirmation | Webhooks (`virtualaccount.credit`, `payout.success`, `payout.failed`) |
| Webhook authenticity | HMAC-SHA256 signature verification (`nomba-signature` header) |

### Webhook Security

Every webhook is verified using HMAC-SHA256 before any state change:

```ts
// src/lib/nomba/client.ts
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = createHmac("sha256", process.env.NOMBA_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return timingSafeEqual(expected, signature); // constant-time comparison
}
```

### Idempotency

All Nomba operations use deterministic references:

| Operation | Reference format | Example |
|---|---|---|
| Virtual account | `<groupId>:<round>:<memberId>` | `grp_family:4:mem_maria` |
| Payout | `payout:<groupId>:<round>` | `payout:grp_family:4` |

Duplicate webhooks are deduplicated via a `processedWebhookRefs` Set — the same event can arrive multiple times and will only be applied once.

---

## Architecture

```
Browser (Next.js 15)
    │
    ├── /app/*           Dashboard UI (groups, analytics, automation, account)
    ├── /               Landing page
    │
    └── /api/*           Route handlers (server)
          │
          ├── src/lib/nomba/client.ts ──► Nomba REST API (sandbox.nomba.com/v1)
          │     OAuth token lifecycle       Virtual Accounts, Transfers, Webhooks
          │
          └── src/lib/backend/store.ts ──► In-memory store
                Groups, Members, Activities,
                Virtual Accounts, Payout Records,
                Payment Methods, Notification Settings
```

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| Payments | Nomba API |
| Deployment | Vercel |

---

## Project Structure

```
src/
  app/
    api/
      groups/             List and create savings groups
      payments/
        collect/          Create Nomba virtual account per member
        payout/           Trigger Nomba Transfer to winner
        status/           Poll virtual accounts + payout records
        reconciliation/   Full cycle breakdown by group + round
      webhooks/nomba/     Receive and verify Nomba events
      activity/           Recent activity feed
      dashboard/          Dashboard metrics
      account/            Account summary + payment methods
      banks/              Nigerian bank list (25 banks)
      settings/           Notification preferences
    app/
      page.tsx            Dashboard
      groups/             Groups management
      analytics/          Savings growth charts
      automation/         Worker logs + reconciliation
      account/            Payment method + account info
      settings/           Notification settings
  components/
    app/                  Dashboard components
    landing/              Marketing page sections
    ui/                   Shared primitives (Button, Card, KyraLogo, etc.)
  lib/
    backend/              Domain types + seeded in-memory store
    nomba/                API client + types
```

---

## API Reference

### Groups

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/groups` | List all savings groups |
| `POST` | `/api/groups` | Create a new savings group |

### Payments

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/payments/collect` | Create Nomba virtual account for a member's contribution |
| `POST` | `/api/payments/payout` | Send pot payout via Nomba Transfer |
| `GET` | `/api/payments/status` | Poll all virtual accounts and payout records |
| `GET` | `/api/payments/reconciliation` | Full cycle breakdown (collections + payouts grouped) |

### Webhooks

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/webhooks/nomba` | Receive Nomba payment events (signature verified) |

### Other

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/activity` | Recent activity feed |
| `GET` | `/api/dashboard` | Dashboard metrics |
| `GET/PATCH` | `/api/settings` | Notification settings |
| `GET` | `/api/account` | Account summary |
| `GET/POST` | `/api/account/payment-method` | Payment method management |
| `GET` | `/api/banks` | List of 25 Nigerian banks |

---

## Local Development

### Prerequisites

- Node.js 18+
- A Nomba sandbox account ([developer.nomba.com](https://developer.nomba.com))

### Setup

```bash
git clone https://github.com/Naomi-Gift/Kyra.git
cd Kyra
npm install
cp .env.local.example .env.local
# Fill in your Nomba credentials in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```bash
# Nomba credentials
NOMBA_ACCOUNT_ID=        # Parent account ID
NOMBA_SUB_ACCOUNT_ID=    # Sub-account ID for transactions
NOMBA_CLIENT_ID=         # OAuth client ID
NOMBA_CLIENT_SECRET=     # OAuth client secret
NOMBA_BASE_URL=https://sandbox.nomba.com/v1

# Webhook verification
NOMBA_WEBHOOK_SECRET=    # From Nomba dashboard / hackathon key
```

### Simulating Webhooks Locally

Use ngrok to expose your local server:

```bash
ngrok http 3000
# Webhook URL: https://<ngrok-id>.ngrok.io/api/webhooks/nomba
```

Simulate a payment confirmation:

```bash
# virtualaccount.credit — member paid
curl -X POST http://localhost:3000/api/webhooks/nomba \
  -H "Content-Type: application/json" \
  -H "nomba-signature: <hmac-sha256-of-body>" \
  -d '{"event":"virtualaccount.credit","data":{"reference":"grp_family:4:mem_maria","status":"success","createdAt":"2026-06-29T10:00:00Z","amount":2500}}'

# payout.success — transfer landed
curl -X POST http://localhost:3000/api/webhooks/nomba \
  -H "Content-Type: application/json" \
  -H "nomba-signature: <hmac-sha256-of-body>" \
  -d '{"event":"payout.success","data":{"reference":"payout:grp_family:4","status":"success","createdAt":"2026-06-29T10:05:00Z","amount":12500}}'
```

---

## Correctness Properties

| Property | Description |
|---|---|
| **Idempotency** | Every Nomba operation uses a deterministic reference. Re-calling is always safe |
| **Crash safety** | `PayoutRecord { status: "pending" }` is written before the Nomba call. Survives server restarts |
| **Webhook deduplication** | `processedWebhookRefs` Set prevents duplicate activity from Nomba retries |
| **No phantom credits** | Contributions only marked paid via webhook — never by the collect endpoint itself |
| **Retry safety** | A failed payout reuses the same reference — calling Nomba twice never double-disburses |

---

## Production Roadmap

The hackathon backend is intentionally in-memory for speed. Moving to production means:

- Replace `store.ts` with PostgreSQL
- Add an auth provider (Clerk, Supabase Auth) for sessions and member invites
- Move Nomba token cache to Redis for multi-instance deployments
- Replace interval-based automation with a proper cron job (Vercel Cron, pg_cron)
- Add full audit logging for every financial event

---

## Built With ♥ for Nomba Hackathon 2026

Kyra demonstrates that the Nomba API is powerful enough to replace an entire informal financial institution — the community savings coordinator — with a few API calls and webhooks.

The same primitives (virtual accounts + transfers + webhooks) that power Kyra could be extended to:
- Loan circles with interest
- Group investment pools
- Business expense splitting
- Community emergency funds
