import { NextResponse } from "next/server";
import { listActivity } from "@/lib/backend/store";

export async function GET() {
  return NextResponse.json({ activity: listActivity() });
}
