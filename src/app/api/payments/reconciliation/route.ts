import { NextResponse } from "next/server";
import {
  listAllVirtualAccounts,
  listAllPayoutRecords,
  listGroups,
} from "@/lib/backend/store";

export async function GET() {
  const vas = listAllVirtualAccounts();
  const payouts = listAllPayoutRecords();
  const groups = listGroups();

  // Group by groupId + round
  const cycleMap = new Map<string, {
    groupId: string;
    groupName: string;
    round: number;
    collections: typeof vas;
    payout: (typeof payouts)[0] | null;
    allPaid: boolean;
    potTotal: number;
  }>();

  for (const va of vas) {
    const key = `${va.groupId}:${va.round}`;
    if (!cycleMap.has(key)) {
      const group = groups.find((g) => g.id === va.groupId);
      cycleMap.set(key, {
        groupId: va.groupId,
        groupName: group?.name ?? va.groupId,
        round: va.round,
        collections: [],
        payout: null,
        allPaid: false,
        potTotal: 0,
      });
    }
    cycleMap.get(key)!.collections.push(va);
  }

  for (const payout of payouts) {
    const key = `${payout.groupId}:${payout.round}`;
    if (cycleMap.has(key)) {
      cycleMap.get(key)!.payout = payout;
    } else {
      const group = groups.find((g) => g.id === payout.groupId);
      cycleMap.set(key, {
        groupId: payout.groupId,
        groupName: group?.name ?? payout.groupId,
        round: payout.round,
        collections: [],
        payout,
        allPaid: false,
        potTotal: 0,
      });
    }
  }

  // Compute derived fields
  const cycles = Array.from(cycleMap.values()).map((cycle) => {
    const allPaid = cycle.collections.length > 0 &&
      cycle.collections.every((c) => !!c.paidAt);
    const group = groups.find((g) => g.id === cycle.groupId);
    const potTotal = group
      ? group.amount * group.members.length
      : 0;
    return { ...cycle, allPaid, potTotal };
  });

  // Most recent rounds first
  cycles.sort((a, b) => b.round - a.round);

  return NextResponse.json({ cycles });
}
