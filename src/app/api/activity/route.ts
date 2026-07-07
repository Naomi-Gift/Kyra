import { NextResponse } from "next/server";
import { listActivity } from "@/lib/backend/store";
import { getUserId, UNAUTHORIZED } from "@/lib/backend/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED();
  return NextResponse.json({ activity: listActivity(userId) }, {
    headers: { "Cache-Control": "no-store" },
  });
}
