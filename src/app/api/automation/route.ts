import { NextResponse } from "next/server";
import { getAutomationStatus } from "@/lib/backend/store";
import { getUserId, UNAUTHORIZED } from "@/lib/backend/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED();
  return NextResponse.json(
    { automation: getAutomationStatus(userId) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST() {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED();
  return NextResponse.json(
    { automation: { ...getAutomationStatus(userId), currentStatus: "running", message: "Automation run queued." } },
    { headers: { "Cache-Control": "no-store" } }
  );
}
