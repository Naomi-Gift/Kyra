// ─── Nomba API auth ─────────────────────────────────────────────────────────

export type NombaTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number; // seconds
};

// ─── Virtual accounts ────────────────────────────────────────────────────────

export type NombaCreateVirtualAccountRequest = {
  /** Unique reference you supply — use to tie back to a KYRA collection */
  reference: string;
  accountName: string;
  /** Sub-account ID to scope the virtual account under */
  accountId?: string;
  /** Optional — if set, account auto-expires after this ISO datetime */
  expiryDate?: string;
  /** Optional BVN for KYC-linked accounts */
  bvn?: string;
};

export type NombaVirtualAccount = {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  reference: string;
  expiryDate?: string;
};

export type NombaCreateVirtualAccountResponse = {
  code: string;
  description: string;
  data: NombaVirtualAccount;
};

// ─── Transfers ───────────────────────────────────────────────────────────────

export type NombaTransferRequest = {
  /** Unique idempotency key — use group+round+memberId */
  reference: string;
  amount: number; // in kobo (NGN * 100)
  beneficiaryAccountNumber: string;
  beneficiaryBankCode: string;
  beneficiaryAccountName: string;
  narration: string;
  /** Sub-account ID to debit for this transfer */
  accountId?: string;
};

export type NombaTransferResponse = {
  code: string;
  description: string;
  data: {
    reference: string;
    status: "success" | "pending" | "failed";
    amount: number;
    fee: number;
    beneficiaryAccountNumber: string;
    beneficiaryBankCode: string;
    beneficiaryAccountName: string;
    sessionId: string;
  };
};

// ─── Webhooks ────────────────────────────────────────────────────────────────

export type NombaWebhookEventType =
  | "collection.credit"
  | "payout.success"
  | "payout.failed"
  | "virtualaccount.credit";

export type NombaWebhookEvent = {
  event: NombaWebhookEventType;
  data: {
    reference: string;
    amount: number; // in kobo
    accountNumber?: string;
    bankCode?: string;
    narration?: string;
    status: string;
    createdAt: string;
  };
};
