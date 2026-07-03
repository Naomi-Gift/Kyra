export type MemberStatus = "ready" | "pending" | "paused";

// ─── Payment methods ──────────────────────────────────────────────────────────

export type PaymentMethod = {
  /** Matches a GroupMember.id */
  memberId: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  accountName: string;
};

// ─── Virtual accounts (Nomba-issued, per collection) ─────────────────────────

export type CollectionVirtualAccount = {
  /** e.g. "grp_family:4:mem_maria" — unique per group + round + member */
  reference: string;
  groupId: string;
  memberId: string;
  round: number;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  /** ISO datetime — set when the contribution is confirmed via webhook */
  paidAt?: string;
};

// ─── Payout records ──────────────────────────────────────────────────────────

export type PayoutRecord = {
  /** e.g. "payout:grp_family:4" */
  reference: string;
  groupId: string;
  memberId: string;
  round: number;
  amountKobo: number;
  status: "pending" | "success" | "failed";
  nombaSessionId?: string;
  createdAt: string;
};

export type GroupStatus = "active" | "collecting" | "paused";

export type ActivityType = "contribution" | "payout" | "cycle" | "reminder";

export type AutomationStatus = "scheduled" | "running" | "healthy" | "attention";

export type GroupMember = {
  id: string;
  name: string;
  email: string;
  status: MemberStatus;
};

export type SavingsGroup = {
  id: string;
  name: string;
  members: GroupMember[];
  amount: number;
  cycleDays: number;
  currentRound: number;
  nextPayoutMemberId: string;
  status: GroupStatus;
  daysLeft: number;
  createdAt: string;
};

export type ActivityItem = {
  id: string;
  type: ActivityType;
  groupId: string;
  memberId?: string;
  description: string;
  amount: number | null;
  occurredAt: string;
};

export type AccountSummary = {
  id: string;
  name: string;
  email: string;
  balance: number;
  totalContributed: number;
  totalReceived: number;
};

export type AutomationRun = {
  id: string;
  status: AutomationStatus;
  startedAt: string;
  finishedAt?: string;
  processedCollections: number;
  processedPayouts: number;
  errors: number;
  logs: Array<{
    time: string;
    level: "info" | "success" | "warn" | "error";
    message: string;
  }>;
};

export type NotificationSettings = {
  cycleStart: boolean;
  collectionDone: boolean;
  payoutReceived: boolean;
  automationError: boolean;
  emailDigest: boolean;
};
