import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/backend/store";

export async function GET() {
  return NextResponse.json({ metrics: getDashboardMetrics() });
}
