import { NextResponse } from "next/server";
import { getNotificationSettings, updateNotificationSettings } from "@/lib/backend/store";

export async function GET() {
  return NextResponse.json({ settings: getNotificationSettings() });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  return NextResponse.json({ settings: updateNotificationSettings(body) });
}
