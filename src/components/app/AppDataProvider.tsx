"use client";
/**
 * AppDataProvider
 *
 * Lives at the layout level — wraps the entire app shell so data is fetched
 * once and stays alive as users navigate between pages. No more stale flashes.
 *
 * All pages consume this via the useAppData() hook instead of calling
 * usePolling() directly for shared data.
 */
import { createContext, useContext, ReactNode } from "react";
import { usePolling } from "@/hooks/usePolling";
import type { SavingsGroup, ActivityItem, CollectionVirtualAccount, PayoutRecord } from "@/lib/backend/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type GroupRow = SavingsGroup & {
  memberCount: number;
  readyCount: number;
  potTotal: number;
  nextPayout: string;
};

type Metrics = {
  totalSaved: number;
  activeMembers: number;
  automatedItems: number;
  activeCycles: number;
  completingSoon: number;
};

type AutomationInfo = {
  currentStatus: string;
  nextRunInMinutes: number;
  totalRuns: number;
  latestRun: {
    processedCollections: number;
    processedPayouts: number;
    errors: number;
  };
};

type EnrichedActivity = ActivityItem & { groupName: string; memberName: string };

type AppData = {
  groups: GroupRow[];
  metrics: Metrics | null;
  automation: AutomationInfo | null;
  virtualAccounts: CollectionVirtualAccount[];
  payoutRecords: PayoutRecord[];
  activity: EnrichedActivity[];
  loading: {
    groups: boolean;
    metrics: boolean;
    automation: boolean;
    payments: boolean;
    activity: boolean;
  };
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AppDataContext = createContext<AppData>({
  groups: [],
  metrics: null,
  automation: null,
  virtualAccounts: [],
  payoutRecords: [],
  activity: [],
  loading: {
    groups: true,
    metrics: true,
    automation: true,
    payments: true,
    activity: true,
  },
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { data: groupsData, loading: groupsLoading } =
    usePolling<{ groups: GroupRow[] }>("/api/groups", 5_000);

  const { data: dashData, loading: metricsLoading } =
    usePolling<{ metrics: Metrics }>("/api/dashboard", 6_000);

  const { data: autoData, loading: autoLoading } =
    usePolling<{ automation: AutomationInfo }>("/api/automation", 30_000);

  const { data: paymentsData, loading: paymentsLoading } =
    usePolling<{ virtualAccounts: CollectionVirtualAccount[]; payoutRecords: PayoutRecord[] }>(
      "/api/payments/status",
      4_000
    );

  const { data: activityData, loading: activityLoading } =
    usePolling<{ activity: EnrichedActivity[] }>("/api/activity", 5_000);

  return (
    <AppDataContext.Provider
      value={{
        groups: groupsData?.groups ?? [],
        metrics: dashData?.metrics ?? null,
        automation: autoData?.automation ?? null,
        virtualAccounts: paymentsData?.virtualAccounts ?? [],
        payoutRecords: paymentsData?.payoutRecords ?? [],
        activity: activityData?.activity ?? [],
        loading: {
          groups: groupsLoading,
          metrics: metricsLoading,
          automation: autoLoading,
          payments: paymentsLoading,
          activity: activityLoading,
        },
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppData(): AppData {
  return useContext(AppDataContext);
}
