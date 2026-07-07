import { NextResponse } from "next/server";
import { getNotificationSettings, updateNotificationSettings } from "@/lib/backend/store";
import { getUserId, UNAUTHORIZED } from "@/lib/backend/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED();
  return NextResponse.json({ settings: getNotificationSettings(userId) });
}

export async function PATCH(request: Request) {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED();
  const body = await request.json();
  return NextResponse.json({ settings: updateNotificationSettings(userId, body) });
}
