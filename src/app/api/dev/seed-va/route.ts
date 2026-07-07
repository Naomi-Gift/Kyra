// Dev-only route: seeds a CollectionVirtualAccount directly into the store.
// NEVER expose in production (guard with NODE_ENV or remove before deploy).
import { NextResponse } from "next/server";
import { saveVirtualAccount } from "@/lib/backend/store";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 403 });
  }
  const body = await request.json();
  const va = saveVirtualAccount(body);
  return NextResponse.json({ virtualAccount: va }, { status: 201 });
}
