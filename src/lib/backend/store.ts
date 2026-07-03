import {
  AccountSummary,
  ActivityItem,
  AutomationRun,
  CollectionVirtualAccount,
  GroupMember,
  NotificationSettings,
  PaymentMethod,
  PayoutRecord,
  SavingsGroup,
} from "./types";

const now = new Date("2026-06-29T09:00:00.000Z");

function daysAgo(days: number) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function minutesAgo(minutes: number) {
  const date = new Date(now);
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
}

const members: GroupMember[] = [
  { id: "mem_maria", name: "Maria S.", email: "maria@example.com", status: "ready" },
  { id: "mem_james", name: "James K.", email: "james@example.com", status: "ready" },
  { id: "mem_aisha", name: "Aisha K.", email: "aisha@example.com", status: "ready" },
  { id: "mem_david", name: "David M.", email: "david@example.com", status: "ready" },
  { id: "mem_tom", name: "Tom W.", email: "tom@example.com", status: "pending" },
];

const groups: SavingsGroup[] = [
  {
    id: "grp_family",
    name: "Family Circle",
    members,
    amount: 25,
    cycleDays: 7,
    currentRound: 4,
    nextPayoutMemberId: "mem_maria",
    status: "active",
    daysLeft: 2,
    createdAt: daysAgo(63),
  },
  {
    id: "grp_colleagues",
    name: "Colleagues Fund",
    members: [
      { id: "mem_james", name: "James K.", email: "james@example.com", status: "ready" },
      { id: "mem_priya", name: "Priya N.", email: "priya@example.com", status: "ready" },
      { id: "mem_lena", name: "Lena C.", email: "lena@example.com", status: "ready" },
      { id: "mem_ben", name: "Ben A.", email: "ben@example.com", status: "ready" },
    ],
    amount: 50,
    cycleDays: 14,
    currentRound: 2,
    nextPayoutMemberId: "mem_james",
    status: "active",
    daysLeft: 6,
    createdAt: daysAgo(42),
  },
  {
    id: "grp_city",
    name: "City Savers",
    members: [
      { id: "mem_aisha", name: "Aisha K.", email: "aisha@example.com", status: "ready" },
      { id: "mem_sofia", name: "Sofia R.", email: "sofia@example.com", status: "ready" },
      { id: "mem_marco", name: "Marco P.", email: "marco@example.com", status: "pending" },
    ],
    amount: 100,
    cycleDays: 30,
    currentRound: 1,
    nextPayoutMemberId: "mem_aisha",
    status: "collecting",
    daysLeft: 14,
    createdAt: daysAgo(18),
  },
];

const activities: ActivityItem[] = [
  {
    id: "act_1",
    type: "contribution",
    groupId: "grp_family",
    memberId: "mem_maria",
    description: "Contribution recorded",
    amount: 25,
    occurredAt: minutesAgo(2),
  },
  {
    id: "act_2",
    type: "payout",
    groupId: "grp_colleagues",
    memberId: "mem_james",
    description: "Payout sent",
    amount: 400,
    occurredAt: minutesAgo(14),
  },
  {
    id: "act_3",
    type: "contribution",
    groupId: "grp_city",
    memberId: "mem_aisha",
    description: "Contribution recorded",
    amount: 100,
    occurredAt: minutesAgo(60),
  },
  {
    id: "act_4",
    type: "cycle",
    groupId: "grp_family",
    description: "New cycle started",
    amount: null,
    occurredAt: minutesAgo(120),
  },
  {
    id: "act_5",
    type: "payout",
    groupId: "grp_family",
    memberId: "mem_tom",
    description: "Payout sent",
    amount: 125,
    occurredAt: daysAgo(1),
  },
];

const account: AccountSummary = {
  id: "acct_kyra_demo",
  name: "Naya Okafor",
  email: "naya@example.com",
  balance: 843.5,
  totalContributed: 200,
  totalReceived: 125,
};

let notificationSettings: NotificationSettings = {
  cycleStart: true,
  collectionDone: true,
  payoutReceived: true,
  automationError: true,
  emailDigest: false,
};

const latestRun: AutomationRun = {
  id: "run_247",
  status: "scheduled",
  startedAt: daysAgo(0),
  finishedAt: minutesAgo(658),
  processedCollections: 110,
  processedPayouts: 3,
  errors: 0,
  logs: [
    { time: "11:02:14", level: "info", message: "Worker woke up and checked group schedules" },
    { time: "11:02:15", level: "info", message: "Found 3 groups due for collection" },
    { time: "11:02:17", level: "success", message: "Recorded $25 from Maria S. for Family Circle" },
    { time: "11:02:18", level: "success", message: "Recorded $25 from David M. for Family Circle" },
    { time: "11:02:22", level: "success", message: "Queued $125 payout to Tom W." },
    { time: "11:02:23", level: "info", message: "Cycle 7 complete and cycle 8 scheduled" },
    { time: "11:02:26", level: "info", message: "Summary sent: 110 items processed, 0 errors" },
  ],
};

export function listGroups() {
  return groups.map(serializeGroup);
}

export function createGroup(input: {
  name: string;
  amount: number;
  cycleDays: number;
  members: Array<{ name: string; email: string }>;
}) {
  const id = `grp_${Date.now()}`;
  const newGroup: SavingsGroup = {
    id,
    name: input.name,
    amount: input.amount,
    cycleDays: input.cycleDays,
    members: input.members.map((member, index) => ({
      id: `${id}_mem_${index + 1}`,
      name: member.name,
      email: member.email,
      status: "pending",
    })),
    currentRound: 1,
    nextPayoutMemberId: `${id}_mem_1`,
    status: "active",
    daysLeft: input.cycleDays,
    createdAt: new Date().toISOString(),
  };

  groups.unshift(newGroup);
  return serializeGroup(newGroup);
}

export function listActivity() {
  return activities.map((activity) => {
    const group = groups.find((item) => item.id === activity.groupId);
    const member = group?.members.find((item) => item.id === activity.memberId);

    return {
      ...activity,
      groupName: group?.name ?? "Unknown group",
      memberName: member?.name ?? "System",
    };
  });
}

export function getDashboardMetrics() {
  const activeGroups = groups.filter((group) => group.status !== "paused");
  const totalSaved = activities.reduce((sum, activity) => {
    return activity.amount ? sum + activity.amount : sum;
  }, 312_000);

  return {
    totalSaved,
    activeMembers: new Set(groups.flatMap((group) => group.members.map((member) => member.email))).size,
    automatedItems: 14_820,
    activeCycles: activeGroups.length,
    completingSoon: activeGroups.filter((group) => group.daysLeft <= 3).length,
  };
}

export function getAccountSummary() {
  return {
    ...account,
    activeGroups: groups.filter((group) => group.status !== "paused").length,
    recentActivity: listActivity().slice(0, 5),
  };
}

export function getAutomationStatus() {
  return {
    currentStatus: "healthy",
    nextRunInMinutes: 683,
    totalRuns: 247,
    latestRun,
  };
}

export function getNotificationSettings() {
  return notificationSettings;
}

export function updateNotificationSettings(settings: Partial<NotificationSettings>) {
  notificationSettings = {
    ...notificationSettings,
    ...settings,
  };

  return notificationSettings;
}

// ─── Payment methods ──────────────────────────────────────────────────────────
// Seeded with demo bank details for existing members.

const paymentMethods: PaymentMethod[] = [
  { memberId: "mem_maria", accountNumber: "0123456789", bankCode: "058", bankName: "GTBank", accountName: "Maria S." },
  { memberId: "mem_james", accountNumber: "0234567890", bankCode: "044", bankName: "Access Bank", accountName: "James K." },
  { memberId: "mem_aisha", accountNumber: "0345678901", bankCode: "033", bankName: "UBA", accountName: "Aisha K." },
  { memberId: "mem_david", accountNumber: "0456789012", bankCode: "011", bankName: "First Bank", accountName: "David M." },
  { memberId: "mem_tom",   accountNumber: "0567890123", bankCode: "057", bankName: "Zenith Bank", accountName: "Tom W." },
];

export function getPaymentMethod(memberId: string): PaymentMethod | undefined {
  return paymentMethods.find((pm) => pm.memberId === memberId);
}

export function upsertPaymentMethod(method: PaymentMethod): PaymentMethod {
  const idx = paymentMethods.findIndex((pm) => pm.memberId === method.memberId);
  if (idx !== -1) {
    paymentMethods[idx] = method;
  } else {
    paymentMethods.push(method);
  }
  return method;
}

// ─── Virtual accounts ─────────────────────────────────────────────────────────

const virtualAccounts: CollectionVirtualAccount[] = [];

export function saveVirtualAccount(va: CollectionVirtualAccount): CollectionVirtualAccount {
  const idx = virtualAccounts.findIndex((v) => v.reference === va.reference);
  if (idx !== -1) {
    virtualAccounts[idx] = va;
  } else {
    virtualAccounts.push(va);
  }
  return va;
}

export function getVirtualAccountByReference(
  reference: string
): CollectionVirtualAccount | undefined {
  return virtualAccounts.find((v) => v.reference === reference);
}

export function listVirtualAccountsForGroup(
  groupId: string
): CollectionVirtualAccount[] {
  return virtualAccounts.filter((v) => v.groupId === groupId);
}

export function listAllVirtualAccounts(): CollectionVirtualAccount[] {
  return [...virtualAccounts];
}

/** Mark a virtual account as paid (called from the webhook handler) */
export function markVirtualAccountPaid(
  reference: string,
  paidAt: string
): CollectionVirtualAccount | undefined {
  const va = virtualAccounts.find((v) => v.reference === reference);
  if (va) {
    va.paidAt = paidAt;

    // Also record in the activity log
    activities.push({
      id: `act_${Date.now()}`,
      type: "contribution",
      groupId: va.groupId,
      memberId: va.memberId,
      description: "Contribution recorded via Nomba",
      amount: null, // will be updated when transfer amount is known
      occurredAt: paidAt,
    });
  }
  return va;
}

// ─── Payout records ───────────────────────────────────────────────────────────

const payoutRecords: PayoutRecord[] = [];

/** Refs of already-processed webhook events — prevents duplicate activity entries */
const processedWebhookRefs = new Set<string>();

export function isWebhookProcessed(ref: string): boolean {
  return processedWebhookRefs.has(ref);
}

export function markWebhookProcessed(ref: string): void {
  processedWebhookRefs.add(ref);
}

export function savePayoutRecord(record: PayoutRecord): PayoutRecord {
  const idx = payoutRecords.findIndex((p) => p.reference === record.reference);
  if (idx !== -1) {
    payoutRecords[idx] = record;
  } else {
    payoutRecords.push(record);
  }
  return record;
}

export function getPayoutRecord(reference: string): PayoutRecord | undefined {
  return payoutRecords.find((p) => p.reference === reference);
}

export function listAllPayoutRecords(): PayoutRecord[] {
  return [...payoutRecords];
}

export function resetPayoutForRetry(reference: string): PayoutRecord | undefined {
  const record = payoutRecords.find((p) => p.reference === reference);
  if (record && record.status === "failed") {
    record.status = "pending";
    record.nombaSessionId = undefined;
  }
  return record;
}

export function updatePayoutStatus(
  reference: string,
  status: PayoutRecord["status"],
  nombaSessionId?: string
): PayoutRecord | undefined {
  const record = payoutRecords.find((p) => p.reference === reference);
  if (record) {
    record.status = status;
    if (nombaSessionId) record.nombaSessionId = nombaSessionId;

    if (status === "success") {
      const group = groups.find((g) => g.id === record.groupId);
      activities.push({
        id: `act_${Date.now()}`,
        type: "payout",
        groupId: record.groupId,
        memberId: record.memberId,
        description: `Payout sent via Nomba — ${group?.name ?? record.groupId}`,
        amount: Math.round(record.amountKobo / 100),
        occurredAt: new Date().toISOString(),
      });
    }
  }
  return record;
}

function serializeGroup(group: SavingsGroup) {
  const nextPayout = group.members.find((member) => member.id === group.nextPayoutMemberId);

  return {
    ...group,
    memberCount: group.members.length,
    readyCount: group.members.filter((member) => member.status === "ready").length,
    potTotal: group.amount * group.members.length,
    nextPayout: nextPayout?.name ?? "Unassigned",
  };
}
