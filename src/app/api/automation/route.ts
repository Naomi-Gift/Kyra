import { NextResponse } from "next/server";
import { getAutomationStatus } from "@/lib/backend/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { automation: getAutomationStatus() },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      automation: {
        ...getAutomationStatus(),
        currentStatus: "running",
        message: "Automation run queued.",
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
