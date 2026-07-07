import { NextResponse } from "next/server";
import { listActivity } from "@/lib/backend/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ activity: listActivity() }, {
    headers: { "Cache-Control": "no-store" },
  });
}
