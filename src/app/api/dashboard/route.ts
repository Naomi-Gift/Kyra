import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/backend/store";
import { getUserId, UNAUTHORIZED } from "@/lib/backend/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED();
  return NextResponse.json({ metrics: getDashboardMetrics(userId) }, {
    headers: { "Cache-Control": "no-store" },
  });
}
