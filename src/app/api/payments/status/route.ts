import { NextResponse } from "next/server";
import { listAllVirtualAccounts, listAllPayoutRecords } from "@/lib/backend/store";

export async function GET() {
  return NextResponse.json({
    virtualAccounts: listAllVirtualAccounts(),
    payoutRecords: listAllPayoutRecords(),
    lastUpdated: new Date().toISOString(),
  });
}
