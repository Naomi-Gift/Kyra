/**
 * Nomba API client
 *
 * Handles OAuth 2.0 token lifecycle (issue → auto-refresh) and wraps
 * the three API surfaces KYRA uses: virtual accounts, transfers, and auth.
 *
 * All config is read from environment variables — never commit real values.
 *
 * Required env vars (add to .env.local):
 *   NOMBA_CLIENT_ID
 *   NOMBA_CLIENT_SECRET
 *   NOMBA_ACCOUNT_ID
 *   NOMBA_BASE_URL          (defaults to sandbox)
 *   NOMBA_WEBHOOK_SECRET    (for verifying incoming webhook signatures)
 */

import type {
  NombaCreateVirtualAccountRequest,
  NombaCreateVirtualAccountResponse,
  NombaTokenResponse,
  NombaTransferRequest,
  NombaTransferResponse,
} from "./types";

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.NOMBA_BASE_URL ?? "https://sandbox.nomba.com/v1";

const CLIENT_ID = process.env.NOMBA_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.NOMBA_CLIENT_SECRET ?? "";

// Parent account ID — used in the accountId header for auth and all requests
const ACCOUNT_ID = process.env.NOMBA_ACCOUNT_ID ?? "";

// Sub-account ID — scope transactional calls (virtual accounts, transfers) here
export const SUB_ACCOUNT_ID = process.env.NOMBA_SUB_ACCOUNT_ID ?? "";

// ─── Token cache (module-level singleton) ────────────────────────────────────
// Fine for a single-process dev/staging server.
// For multi-instance production, move token storage to Redis or a DB.

type TokenCache = {
  accessToken: string;
  refreshToken: string;
  /** Unix ms timestamp when the access token expires */
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

/** Returns true when the access token expires within the next 5 minutes */
function isExpiringSoon(cache: TokenCache): boolean {
  return Date.now() >= cache.expiresAt - 5 * 60 * 1000;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function issueToken(): Promise<TokenCache> {
  const res = await fetch(`${BASE_URL}/auth/token/issue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accountId: ACCOUNT_ID,
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Nomba token issue failed (${res.status}): ${text}`);
  }

  const json: NombaTokenResponse = await res.json();
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    // expires_in is in seconds; store as an absolute ms timestamp
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

async function refreshToken(refreshTkn: string): Promise<TokenCache> {
  const res = await fetch(`${BASE_URL}/auth/token/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accountId: ACCOUNT_ID,
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshTkn,
    }),
  });

  if (!res.ok) {
    // If refresh fails (e.g. token revoked), fall back to issuing a new one
    return issueToken();
  }

  const json: NombaTokenResponse = await res.json();
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

/** Returns a valid access token, refreshing or re-issuing as needed */
async function getAccessToken(): Promise<string> {
  if (!tokenCache) {
    tokenCache = await issueToken();
    return tokenCache.accessToken;
  }

  if (isExpiringSoon(tokenCache)) {
    tokenCache = await refreshToken(tokenCache.refreshToken);
  }

  return tokenCache.accessToken;
}

// ─── Base request helper ─────────────────────────────────────────────────────

async function nombaFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      accountId: ACCOUNT_ID,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Nomba API error ${res.status} on ${path}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Virtual Accounts ────────────────────────────────────────────────────────

/**
 * Creates a one-time virtual account for a group collection cycle.
 *
 * @param params.reference  - Unique KYRA reference (e.g. "grp_family:round:4:mem_maria")
 * @param params.accountName - Display name shown to the paying member
 */
export async function createVirtualAccount(
  params: NombaCreateVirtualAccountRequest
): Promise<NombaCreateVirtualAccountResponse> {
  return nombaFetch<NombaCreateVirtualAccountResponse>(
    "/accounts/virtual",
    {
      method: "POST",
      body: JSON.stringify(params),
    }
  );
}

// ─── Transfers ───────────────────────────────────────────────────────────────

/**
 * Sends the full pot payout to the winning member's bank account.
 * Amount must be in kobo (multiply NGN by 100).
 *
 * @param params.reference - Unique idempotency key (e.g. "payout:grp_family:round:4")
 */
export async function sendTransfer(
  params: NombaTransferRequest
): Promise<NombaTransferResponse> {
  return nombaFetch<NombaTransferResponse>("/transfers", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ─── Webhook signature verification ─────────────────────────────────────────

import { createHmac } from "crypto";

/**
 * Verifies the HMAC-SHA256 signature Nomba attaches to every webhook request.
 * Call this at the top of the webhook route before processing any payload.
 *
 * @param rawBody  - The raw request body string (do NOT parse before verifying)
 * @param signature - Value of the `x-nomba-signature` header
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.NOMBA_WEBHOOK_SECRET ?? "";
  if (!secret) {
    console.warn("NOMBA_WEBHOOK_SECRET is not set — skipping signature check");
    return true; // permissive in dev; lock this down in production
  }

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
