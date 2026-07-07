import { NextResponse } from "next/server";
import { listAllVirtualAccounts, listAllPayoutRecords } from "@/lib/backend/store";
import { getUserId, UNAUTHORIZED } from "@/lib/backend/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED();
  return NextResponse.json({
    virtualAccounts: listAllVirtualAccounts(userId),
    payoutRecords:   listAllPayoutRecords(userId),
    lastUpdated:     new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}
