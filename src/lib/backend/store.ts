/**
 * Per-user in-memory store.
 *
 * Every user gets their own isolated sandbox: groups, activities, virtual
 * accounts, payout records, and payment methods are all keyed by userId.
 * The demo account (user_demo) is pre-seeded with sample data so the app
 * is showcaseable without signing up. New users start with a clean slate.
 *
 * All store helpers accept a `userId` as their first argument. Route handlers
 * resolve it from the session via `auth()` before calling into the store.
 */

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
import { findUserById } from "./users";

// ─── Per-user data container ──────────────────────────────────────────────────

type UserStore = {
  groups: SavingsGroup[];
  activities: ActivityItem[];
  virtualAccounts: CollectionVirtualAccount[];
  payoutRecords: PayoutRecord[];
  paymentMethods: PaymentMethod[];
  processedWebhookRefs: Set<string>;
  notificationSettings: NotificationSettings;
  automationRun: AutomationRun;
  totalRuns: number;
};

// ─── Time helpers (relative to a fixed demo clock for seeded data) ────────────

const DEMO_NOW = new Date("2026-06-29T09:00:00.000Z");

function daysAgo(days: number, base = DEMO_NOW) {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function minutesAgo(minutes: number, base = DEMO_NOW) {
  const d = new Date(base);
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
}

// ─── Demo seed data ───────────────────────────────────────────────────────────

function makeDemoStore(): UserStore {
  const demoMembers: GroupMember[] = [
    { id: "mem_maria", name: "Maria S.",  email: "maria@example.com", status: "ready"   },
    { id: "mem_james", name: "James K.",  email: "james@example.com", status: "ready"   },
    { id: "mem_aisha", name: "Aisha K.",  email: "aisha@example.com", status: "ready"   },
    { id: "mem_david", name: "David M.",  email: "david@example.com", status: "ready"   },
    { id: "mem_tom",   name: "Tom W.",    email: "tom@example.com",   status: "pending" },
  ];

  const groups: SavingsGroup[] = [
    {
      id: "grp_family",
      name: "Family Circle",
      members: demoMembers,
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
        { id: "mem_lena",  name: "Lena C.",  email: "lena@example.com",  status: "ready" },
        { id: "mem_ben",   name: "Ben A.",   email: "ben@example.com",   status: "ready" },
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
        { id: "mem_aisha", name: "Aisha K.", email: "aisha@example.com", status: "ready"   },
        { id: "mem_sofia", name: "Sofia R.", email: "sofia@example.com", status: "ready"   },
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
    { id: "act_1", type: "contribution", groupId: "grp_family",     memberId: "mem_maria", description: "Contribution recorded", amount: 25,  occurredAt: minutesAgo(2)   },
    { id: "act_2", type: "payout",       groupId: "grp_colleagues", memberId: "mem_james", description: "Payout sent",           amount: 400, occurredAt: minutesAgo(14)  },
    { id: "act_3", type: "contribution", groupId: "grp_city",       memberId: "mem_aisha", description: "Contribution recorded", amount: 100, occurredAt: minutesAgo(60)  },
    { id: "act_4", type: "cycle",        groupId: "grp_family",                            description: "New cycle started",     amount: null, occurredAt: minutesAgo(120) },
    { id: "act_5", type: "payout",       groupId: "grp_family",     memberId: "mem_tom",   description: "Payout sent",           amount: 125, occurredAt: daysAgo(1)      },
  ];

  return {
    groups,
    activities,
    virtualAccounts: [],
    payoutRecords: [],
    paymentMethods: [
      { memberId: "mem_maria", accountNumber: "0123456789", bankCode: "058", bankName: "GTBank",      accountName: "Maria S." },
      { memberId: "mem_james", accountNumber: "0234567890", bankCode: "044", bankName: "Access Bank", accountName: "James K." },
      { memberId: "mem_aisha", accountNumber: "0345678901", bankCode: "033", bankName: "UBA",         accountName: "Aisha K." },
      { memberId: "mem_david", accountNumber: "0456789012", bankCode: "011", bankName: "First Bank",  accountName: "David M." },
      { memberId: "mem_tom",   accountNumber: "0567890123", bankCode: "057", bankName: "Zenith Bank", accountName: "Tom W."   },
    ],
    processedWebhookRefs: new Set(),
    notificationSettings: {
      cycleStart: true,
      collectionDone: true,
      payoutReceived: true,
      automationError: true,
      emailDigest: false,
    },
    automationRun: {
      id: "run_247",
      status: "scheduled",
      startedAt: daysAgo(0),
      finishedAt: minutesAgo(658),
      processedCollections: 110,
      processedPayouts: 3,
      errors: 0,
      logs: [
        { time: "11:02:14", level: "info",    message: "Worker woke up and checked group schedules" },
        { time: "11:02:15", level: "info",    message: "Found 3 groups due for collection"          },
        { time: "11:02:17", level: "success", message: "Recorded ₦25 from Maria S. — Family Circle" },
        { time: "11:02:18", level: "success", message: "Recorded ₦25 from David M. — Family Circle" },
        { time: "11:02:22", level: "success", message: "Queued ₦125 payout to Tom W."               },
        { time: "11:02:23", level: "info",    message: "Cycle 7 complete · advancing to cycle 8"    },
        { time: "11:02:26", level: "info",    message: "Summary: 110 items processed · 0 errors"    },
      ],
    },
    totalRuns: 247,
  };
}

function makeEmptyStore(): UserStore {
  return {
    groups: [],
    activities: [],
    virtualAccounts: [],
    payoutRecords: [],
    paymentMethods: [],
    processedWebhookRefs: new Set(),
    notificationSettings: {
      cycleStart: true,
      collectionDone: true,
      payoutReceived: true,
      automationError: true,
      emailDigest: false,
    },
    automationRun: {
      id: "run_0",
      status: "scheduled",
      startedAt: new Date().toISOString(),
      processedCollections: 0,
      processedPayouts: 0,
      errors: 0,
      logs: [
        { time: new Date().toTimeString().slice(0, 8), level: "info", message: "Worker ready — create a group to get started" },
      ],
    },
    totalRuns: 0,
  };
}

// ─── Store registry ───────────────────────────────────────────────────────────

const registry = new Map<string, UserStore>();

function getStore(userId: string): UserStore {
  if (!registry.has(userId)) {
    registry.set(userId, userId === "user_demo" ? makeDemoStore() : makeEmptyStore());
  }
  return registry.get(userId)!;
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export function listGroups(userId: string) {
  return getStore(userId).groups.map(serializeGroup);
}

export function createGroup(
  userId: string,
  input: {
    name: string;
    amount: number;
    cycleDays: number;
    members: Array<{ name: string; email: string }>;
  }
) {
  const store = getStore(userId);
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

  store.groups.unshift(newGroup);

  // Log a cycle activity
  store.activities.unshift({
    id: `act_${Date.now()}`,
    type: "cycle",
    groupId: id,
    description: `New savings circle created — ${input.name}`,
    amount: null,
    occurredAt: new Date().toISOString(),
  });

  return serializeGroup(newGroup);
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export function listActivity(userId: string) {
  const store = getStore(userId);
  return store.activities
    .slice()
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .map((activity) => {
      const group  = store.groups.find((g) => g.id === activity.groupId);
      const member = group?.members.find((m) => m.id === activity.memberId);
      return {
        ...activity,
        groupName:  group?.name   ?? "Unknown group",
        memberName: member?.name  ?? "System",
      };
    });
}

// ─── Dashboard metrics ────────────────────────────────────────────────────────

export function getDashboardMetrics(userId: string) {
  const store = getStore(userId);
  const activeGroups = store.groups.filter((g) => g.status !== "paused");

  // Total saved = sum of all confirmed contribution amounts
  const totalSaved = store.activities
    .filter((a) => a.type === "contribution" && a.amount !== null)
    .reduce((sum, a) => sum + (a.amount ?? 0), 0);

  // For the demo account, add the seed baseline so numbers look real
  const baseline = userId === "user_demo" ? 312_000 : 0;

  const allMembers = new Set(
    store.groups.flatMap((g) => g.members.map((m) => m.email))
  );

  const automatedItems =
    store.payoutRecords.filter((p) => p.status === "success").length +
    store.virtualAccounts.filter((v) => !!v.paidAt).length +
    (userId === "user_demo" ? 14_820 : 0);

  return {
    totalSaved: baseline + totalSaved,
    activeMembers: allMembers.size,
    automatedItems,
    activeCycles: activeGroups.length,
    completingSoon: activeGroups.filter((g) => g.daysLeft <= 3).length,
  };
}

// ─── Account summary ──────────────────────────────────────────────────────────

export function getAccountSummary(userId: string) {
  const store = getStore(userId);
  const user  = findUserById(userId);

  const totalContributed = store.activities
    .filter((a) => a.type === "contribution" && a.amount !== null)
    .reduce((sum, a) => sum + (a.amount ?? 0), 0);

  const totalReceived = store.payoutRecords
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + Math.round(p.amountKobo / 100), 0);

  return {
    id:    userId,
    name:  user?.name  ?? "Unknown",
    email: user?.email ?? "",
    balance: totalReceived - totalContributed,
    totalContributed,
    totalReceived,
    activeGroups: store.groups.filter((g) => g.status !== "paused").length,
    recentActivity: listActivity(userId).slice(0, 5),
  };
}

// ─── Automation status ────────────────────────────────────────────────────────

export function getAutomationStatus(userId: string) {
  const store = getStore(userId);
  return {
    currentStatus: "healthy",
    nextRunInMinutes: 683,
    totalRuns: store.totalRuns,
    latestRun: store.automationRun,
  };
}

// ─── Notification settings ────────────────────────────────────────────────────

export function getNotificationSettings(userId: string) {
  return getStore(userId).notificationSettings;
}

export function updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>) {
  const store = getStore(userId);
  store.notificationSettings = { ...store.notificationSettings, ...settings };
  return store.notificationSettings;
}

// ─── Payment methods ──────────────────────────────────────────────────────────

export function getPaymentMethod(userId: string, memberId: string): PaymentMethod | undefined {
  return getStore(userId).paymentMethods.find((pm) => pm.memberId === memberId);
}

export function upsertPaymentMethod(userId: string, method: PaymentMethod): PaymentMethod {
  const store = getStore(userId);
  const idx = store.paymentMethods.findIndex((pm) => pm.memberId === method.memberId);
  if (idx !== -1) {
    store.paymentMethods[idx] = method;
  } else {
    store.paymentMethods.push(method);
  }

  // Log the event
  store.activities.unshift({
    id: `act_${Date.now()}`,
    type: "reminder",
    groupId: "",
    description: `Bank account saved — ${method.bankName} ···${method.accountNumber.slice(-4)}`,
    amount: null,
    occurredAt: new Date().toISOString(),
  });

  return method;
}

// ─── Webhook idempotency ──────────────────────────────────────────────────────
// Webhooks are not user-scoped (Nomba fires them globally), so we use a
// global set. The per-user store also gets the activity log entry.

const globalProcessedRefs = new Set<string>();

export function isWebhookProcessed(ref: string): boolean {
  return globalProcessedRefs.has(ref);
}

export function markWebhookProcessed(ref: string): void {
  globalProcessedRefs.add(ref);
}

// ─── Virtual accounts ─────────────────────────────────────────────────────────

export function saveVirtualAccount(
  userId: string,
  va: CollectionVirtualAccount
): CollectionVirtualAccount {
  const store = getStore(userId);
  const idx = store.virtualAccounts.findIndex((v) => v.reference === va.reference);
  if (idx !== -1) {
    store.virtualAccounts[idx] = va;
  } else {
    store.virtualAccounts.push(va);
  }
  return va;
}

export function getVirtualAccountByReference(
  userId: string,
  reference: string
): CollectionVirtualAccount | undefined {
  return getStore(userId).virtualAccounts.find((v) => v.reference === reference);
}

export function listVirtualAccountsForGroup(
  userId: string,
  groupId: string
): CollectionVirtualAccount[] {
  return getStore(userId).virtualAccounts.filter((v) => v.groupId === groupId);
}

export function listAllVirtualAccounts(userId: string): CollectionVirtualAccount[] {
  return [...getStore(userId).virtualAccounts];
}

export function markVirtualAccountPaid(
  userId: string,
  reference: string,
  paidAt: string
): CollectionVirtualAccount | undefined {
  if (isWebhookProcessed(reference)) {
    return getStore(userId).virtualAccounts.find((v) => v.reference === reference);
  }

  const store = getStore(userId);
  const va = store.virtualAccounts.find((v) => v.reference === reference);
  if (va) {
    va.paidAt = paidAt;
    store.activities.unshift({
      id: `act_${Date.now()}`,
      type: "contribution",
      groupId: va.groupId,
      memberId: va.memberId,
      description: "Contribution confirmed via Nomba",
      amount: null,
      occurredAt: paidAt,
    });
    markWebhookProcessed(reference);
  }
  return va;
}

// ─── Payout records ───────────────────────────────────────────────────────────

export function savePayoutRecord(userId: string, record: PayoutRecord): PayoutRecord {
  const store = getStore(userId);
  const idx = store.payoutRecords.findIndex((p) => p.reference === record.reference);
  if (idx !== -1) {
    store.payoutRecords[idx] = record;
  } else {
    store.payoutRecords.push(record);
  }
  return record;
}

export function getPayoutRecord(userId: string, reference: string): PayoutRecord | undefined {
  return getStore(userId).payoutRecords.find((p) => p.reference === reference);
}

export function listAllPayoutRecords(userId: string): PayoutRecord[] {
  return [...getStore(userId).payoutRecords];
}

export function resetPayoutForRetry(userId: string, reference: string): PayoutRecord | undefined {
  const record = getStore(userId).payoutRecords.find((p) => p.reference === reference);
  if (record && record.status === "failed") {
    record.status = "pending";
    record.nombaSessionId = undefined;
  }
  return record;
}

export function updatePayoutStatus(
  userId: string,
  reference: string,
  status: PayoutRecord["status"],
  nombaSessionId?: string
): PayoutRecord | undefined {
  if (isWebhookProcessed(reference)) {
    return getStore(userId).payoutRecords.find((p) => p.reference === reference);
  }

  const store = getStore(userId);
  const record = store.payoutRecords.find((p) => p.reference === reference);
  if (record) {
    record.status = status;
    if (nombaSessionId) record.nombaSessionId = nombaSessionId;

    if (status === "success") {
      const group = store.groups.find((g) => g.id === record.groupId);
      store.activities.unshift({
        id: `act_${Date.now()}`,
        type: "payout",
        groupId: record.groupId,
        memberId: record.memberId,
        description: `Payout sent via Nomba — ${group?.name ?? record.groupId}`,
        amount: Math.round(record.amountKobo / 100),
        occurredAt: new Date().toISOString(),
      });
    }

    markWebhookProcessed(reference);
  }
  return record;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function serializeGroup(group: SavingsGroup) {
  const nextPayout = group.members.find((m) => m.id === group.nextPayoutMemberId);
  return {
    ...group,
    memberCount: group.members.length,
    readyCount:  group.members.filter((m) => m.status === "ready").length,
    potTotal:    group.amount * group.members.length,
    nextPayout:  nextPayout?.name ?? "Unassigned",
  };
}

// ─── Cross-user lookups (for webhook handler which has no session) ────────────

export function findUserIdForVirtualAccount(reference: string): string | null {
  for (const [userId, store] of Array.from(registry.entries())) {
    if (store.virtualAccounts.some((v) => v.reference === reference)) return userId;
  }
  return null;
}

export function findUserIdForPayoutRecord(reference: string): string | null {
  for (const [userId, store] of Array.from(registry.entries())) {
    if (store.payoutRecords.some((p) => p.reference === reference)) return userId;
  }
  return null;
}
