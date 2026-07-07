import { NextResponse } from "next/server";
import { getPaymentMethod, upsertPaymentMethod } from "@/lib/backend/store";
import { NIGERIAN_BANKS } from "@/lib/banks";
import { getUserId, UNAUTHORIZED } from "@/lib/backend/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED();

  const { searchParams } = new URL(request.url);
  // memberId defaults to the logged-in user's own ID
  const memberId = searchParams.get("memberId") ?? userId;
  const pm = getPaymentMethod(userId, memberId);
  return NextResponse.json({ paymentMethod: pm ?? null }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED();

  const body = await request.json();
  const { memberId, accountNumber, bankCode, accountName } = body;

  if (!memberId || !accountNumber || !bankCode || !accountName) {
    return NextResponse.json(
      { error: "memberId, accountNumber, bankCode, and accountName are required." },
      { status: 400 }
    );
  }

  const bank     = NIGERIAN_BANKS.find((b) => b.code === String(bankCode));
  const bankName = bank?.name ?? String(bankCode);

  const paymentMethod = upsertPaymentMethod(userId, {
    memberId:      String(memberId),
    accountNumber: String(accountNumber),
    bankCode:      String(bankCode),
    bankName,
    accountName:   String(accountName),
  });

  return NextResponse.json({ paymentMethod });
}
