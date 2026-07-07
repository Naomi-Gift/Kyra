import { NextResponse } from "next/server";
import { getAccountSummary } from "@/lib/backend/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { account: getAccountSummary() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
