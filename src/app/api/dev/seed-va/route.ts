import { NextResponse } from "next/server";
import { saveVirtualAccount } from "@/lib/backend/store";
import { getUserId, UNAUTHORIZED } from "@/lib/backend/session";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 403 });
  }
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED();
  const body = await request.json();
  const va = saveVirtualAccount(userId, body);
  return NextResponse.json({ virtualAccount: va }, { status: 201 });
}
