import { NextResponse } from "next/server";
import { getAccountSummary } from "@/lib/backend/store";
import { getUserId, UNAUTHORIZED } from "@/lib/backend/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED();
  return NextResponse.json(
    { account: getAccountSummary(userId) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
