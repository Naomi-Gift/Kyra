/**
 * Email notifications — powered by Resend.
 *
 * All 5 required functions:
 *   notifyOnrampNeeded()      — member needs to top up before collection
 *   notifyCollection()        — member's contribution was collected
 *   notifyCollectionFailed()  — member's transferFrom failed
 *   notifyPotReceived()       — member received the rotating pot
 *   notifyLowTrust()          — member's trust score is below threshold
 *
 * Requires env:
 *   RESEND_API_KEY  — Resend API key
 *   FROM_EMAIL      — sender address (e.g. noreply@chorеagent.xyz)
 *   PUBLIC_URL      — frontend URL for CTA links
 */

import { logger } from "./logger.js";

// ── Resend client (lazy-loaded to avoid hard crash if key missing) ─────────────
let _resend: { emails: { send: (opts: ResendSendOptions) => Promise<{ error: unknown }> } } | null = null;

interface ResendSendOptions {
  from:    string;
  to:      string[];
  subject: string;
  html:    string;
}

async function resend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      logger.warn("RESEND_API_KEY not set — email notifications disabled");
      return null;
    }
    // Dynamic import so the agent still starts without the Resend SDK installed
    try {
      const { Resend } = await import("resend");
      _resend = new Resend(key);
    } catch {
      logger.warn("Resend SDK not installed — run: npm install resend");
      return null;
    }
  }
  return _resend;
}

const FROM  = process.env.FROM_EMAIL  ?? "noreply@kyra.xyz";
const BASE  = process.env.PUBLIC_URL  ?? "https://kyra.xyz";

// ── Fonbnk URL builder ────────────────────────────────────────────────────────
function fonbnkUrl(walletAddress: string, amount: number): string {
  const params = new URLSearchParams({
    network:       "CELO",
    asset:         "CUSD",
    walletAddress,
    amount:        amount.toString(),
    currency:      "crypto",
  });
  return `https://widget.fonbnk.com?${params.toString()}`;
}

// ── Send helper ───────────────────────────────────────────────────────────────
async function send(to: string, subject: string, html: string): Promise<void> {
  const client = await resend();
  if (!client) return;

  const { error } = await client.emails.send({ from: FROM, to: [to], subject, html });
  if (error) {
    logger.warn({ error, to, subject }, "Email send failed");
  } else {
    logger.info({ to, subject }, "Email sent");
  }
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const S = {
  wrap:    "font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#050508;color:#e8e8f0;padding:32px 24px;border-radius:16px;",
  logo:    "font-size:20px;font-weight:700;color:#fbbf24;margin-bottom:24px;",
  h1:      "font-size:22px;font-weight:600;color:#ffffff;margin:0 0 12px;",
  body:    "font-size:15px;color:rgba(232,232,240,0.7);line-height:1.6;margin:0 0 20px;",
  amount:  "font-size:28px;font-weight:700;color:#fbbf24;",
  card:    "background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px 20px;margin:16px 0;",
  btn:     "display:inline-block;background:#fbbf24;color:#050508;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;",
  btnGhost:"display:inline-block;border:1px solid rgba(255,255,255,0.2);color:#e8e8f0;font-weight:600;padding:11px 22px;border-radius:10px;text-decoration:none;font-size:14px;",
  label:   "font-size:11px;color:rgba(232,232,240,0.4);text-transform:uppercase;letter-spacing:0.1em;",
  footer:  "font-size:12px;color:rgba(232,232,240,0.3);margin-top:32px;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;",
};

function layout(content: string): string {
  return `
<div style="${S.wrap}">
  <div style="${S.logo}">Kyra</div>
  ${content}
  <div style="${S.footer}">You are receiving this because you are a member of a Kyra savings circle.<br>
  <a href="${BASE}" style="color:#fbbf24;text-decoration:none;">View your dashboard</a></div>
</div>`;
}

// ── 1. notifyOnrampNeeded ─────────────────────────────────────────────────────
export async function notifyOnrampNeeded(params: {
  to:            string;
  memberAddress: string;
  groupName:     string;
  amountNeeded:  number;
}): Promise<void> {
  const topUpUrl = fonbnkUrl(params.memberAddress, params.amountNeeded);

  await send(
    params.to,
    `Action needed: top up cUSD for ${params.groupName}`,
    layout(`
      <h1 style="${S.h1}">Your wallet needs a top-up</h1>
      <p style="${S.body}">
        The next collection for <strong>${params.groupName}</strong> is coming up and your
        wallet doesn't have enough cUSD to cover your contribution.
      </p>
      <div style="${S.card}">
        <div style="${S.label}">Amount needed</div>
        <div style="${S.amount}">$${params.amountNeeded.toFixed(2)} cUSD</div>
      </div>
      <p style="${S.body}">
        Use Fonbnk to top up instantly with mobile money:
      </p>
      <a href="${topUpUrl}" style="${S.btn}">Top up with Fonbnk</a>
      <p style="margin-top:12px;${S.body}">
        Your wallet: <code style="color:#a78bfa;">${params.memberAddress}</code>
      </p>
    `)
  );
}

// ── 2. notifyCollection ───────────────────────────────────────────────────────
export async function notifyCollection(params: {
  to:            string;
  memberAddress: string;
  groupName:     string;
  amount:        number;
  round:         number;
  totalMembers:  number;
  txHash:        string;
}): Promise<void> {
  const explorerUrl = `https://celoscan.io/tx/${params.txHash}`;

  await send(
    params.to,
    `Contribution collected — ${params.groupName}`,
    layout(`
      <h1 style="${S.h1}">Your contribution was collected</h1>
      <p style="${S.body}">
        Kyra collected your contribution for <strong>${params.groupName}</strong>.
        You're on round ${params.round} of ${params.totalMembers}.
      </p>
      <div style="${S.card}">
        <div style="${S.label}">Collected</div>
        <div style="${S.amount}">$${params.amount.toFixed(2)} cUSD</div>
      </div>
      <a href="${explorerUrl}" style="${S.btnGhost}">View on Celoscan</a>
    `)
  );
}

// ── 3. notifyCollectionFailed ─────────────────────────────────────────────────
export async function notifyCollectionFailed(params: {
  to:            string;
  memberAddress: string;
  groupName:     string;
  amount:        number;
  trustScore:    number;
}): Promise<void> {
  const topUpUrl = fonbnkUrl(params.memberAddress, params.amount);

  await send(
    params.to,
    `Collection failed — action required for ${params.groupName}`,
    layout(`
      <h1 style="${S.h1}">Your contribution could not be collected</h1>
      <p style="${S.body}">
        Kyra tried to collect your contribution for <strong>${params.groupName}</strong>
        but the transaction failed. This has lowered your trust score.
      </p>
      <div style="${S.card}">
        <div style="${S.label}">Amount missed</div>
        <div style="${S.amount}" style="color:#f43f5e;">$${params.amount.toFixed(2)} cUSD</div>
        <br>
        <div style="${S.label}">Current trust score</div>
        <div style="font-size:20px;font-weight:700;color:${params.trustScore < 40 ? "#f43f5e" : params.trustScore < 60 ? "#fbbf24" : "#34d399"};">
          ${params.trustScore}/200
        </div>
      </div>
      <p style="${S.body}">
        Check your cUSD balance and make sure you've approved the vault.
        Top up instantly with Fonbnk:
      </p>
      <a href="${topUpUrl}" style="${S.btn}">Top up with Fonbnk</a>
    `)
  );
}

// ── 4. notifyPotReceived ──────────────────────────────────────────────────────
export async function notifyPotReceived(params: {
  to:            string;
  memberAddress: string;
  groupName:     string;
  principal:     number;
  yield:         number;
  total:         number;
  txHash:        string;
}): Promise<void> {
  const explorerUrl  = `https://celoscan.io/tx/${params.txHash}`;
  const offrampUrl   = fonbnkUrl(params.memberAddress, params.total);

  await send(
    params.to,
    `You received the pot — ${params.groupName}`,
    layout(`
      <h1 style="${S.h1}">The pot is in your wallet 🎉</h1>
      <p style="${S.body}">
        Kyra released the rotating pot for <strong>${params.groupName}</strong>
        directly to your wallet.
      </p>
      <div style="${S.card}">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="${S.label}">Principal</td>
            <td style="text-align:right;font-weight:600;color:#e8e8f0;">$${params.principal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="${S.label}">Aave yield</td>
            <td style="text-align:right;font-weight:600;color:#34d399;">+$${params.yield.toFixed(2)}</td>
          </tr>
          <tr style="border-top:1px solid rgba(255,255,255,0.08);">
            <td style="${S.label};padding-top:8px;">Total received</td>
            <td style="text-align:right;padding-top:8px;"><span style="${S.amount}">$${params.total.toFixed(2)}</span></td>
          </tr>
        </table>
      </div>
      <p style="${S.body}">Want to cash out to mobile money?</p>
      <a href="${offrampUrl}" style="${S.btn}">Offramp with Fonbnk</a>
      &nbsp;
      <a href="${explorerUrl}" style="${S.btnGhost}">View on Celoscan</a>
    `)
  );
}

// ── 5. notifyLowTrust ─────────────────────────────────────────────────────────
export async function notifyLowTrust(params: {
  to:            string;
  memberAddress: string;
  groupName:     string;
  trustScore:    number;
  threshold:     number;
}): Promise<void> {
  const dashboardUrl = `${BASE}/app`;

  await send(
    params.to,
    `Warning: low trust score in ${params.groupName}`,
    layout(`
      <h1 style="${S.h1}">Your trust score is low</h1>
      <p style="${S.body}">
        Your trust score in <strong>${params.groupName}</strong> has dropped below
        the ${params.threshold} threshold. If it falls below 40, your group may
        vote to remove you from the circle.
      </p>
      <div style="${S.card}">
        <div style="${S.label}">Current trust score</div>
        <div style="font-size:32px;font-weight:700;color:${params.trustScore < 40 ? "#f43f5e" : "#fbbf24"};">
          ${params.trustScore}<span style="font-size:16px;color:rgba(232,232,240,0.4);">/200</span>
        </div>
        <div style="${S.label};margin-top:8px;">Threshold</div>
        <div style="font-size:16px;font-weight:600;color:rgba(232,232,240,0.5);">${params.threshold}</div>
      </div>
      <p style="${S.body}">
        Make sure your cUSD allowance is approved and your wallet has enough
        balance for the next collection cycle.
      </p>
      <a href="${dashboardUrl}" style="${S.btn}">View your dashboard</a>
    `)
  );
}
