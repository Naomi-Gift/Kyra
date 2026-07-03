import { NextResponse } from "next/server";
import { getAutomationStatus } from "@/lib/backend/store";

export async function GET() {
  return NextResponse.json({ automation: getAutomationStatus() });
}

export async function POST() {
  return NextResponse.json({
    automation: {
      ...getAutomationStatus(),
      currentStatus: "running",
      message: "Automation run queued.",
    },
  });
}
