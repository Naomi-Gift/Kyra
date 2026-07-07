import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/backend/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ metrics: getDashboardMetrics() }, {
    headers: { "Cache-Control": "no-store" },
  });
}
