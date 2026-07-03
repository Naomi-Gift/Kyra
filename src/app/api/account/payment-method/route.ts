import { NextResponse } from "next/server";
import { getPaymentMethod, upsertPaymentMethod } from "@/lib/backend/store";
import { NIGERIAN_BANKS } from "@/lib/banks";

// Hardcoded to the demo account member for now
const DEMO_MEMBER_ID = "mem_maria";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId") ?? DEMO_MEMBER_ID;
  const pm = getPaymentMethod(memberId);
  return NextResponse.json({ paymentMethod: pm ?? null });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { memberId, accountNumber, bankCode, accountName } = body;

  if (!memberId || !accountNumber || !bankCode || !accountName) {
    return NextResponse.json(
      { error: "memberId, accountNumber, bankCode, and accountName are required." },
      { status: 400 }
    );
  }

  const bank = NIGERIAN_BANKS.find((b) => b.code === String(bankCode));
  const bankName = bank?.name ?? String(bankCode);

  const paymentMethod = upsertPaymentMethod({
    memberId: String(memberId),
    accountNumber: String(accountNumber),
    bankCode: String(bankCode),
    bankName,
    accountName: String(accountName),
  });

  return NextResponse.json({ paymentMethod });
}
