import { NextResponse } from "next/server";
import { getAccountSummary } from "@/lib/backend/store";

export async function GET() {
  return NextResponse.json({ account: getAccountSummary() });
}
