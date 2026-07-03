import { NextResponse } from "next/server";
import { getPaymentMethod, upsertPaymentMethod } from "@/lib/backend/store";

// Hardcoded to the demo account member for now
const DEMO_MEMBER_ID = "mem_maria";

export async function GET() {
  const pm = getPaymentMethod(DEMO_MEMBER_ID);
  return NextResponse.json({ paymentMethod: pm ?? null });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { memberId, accountNumber, bankCode, bankName, accountName } = body;

  if (!memberId || !accountNumber || !bankCode || !accountName) {
    return NextResponse.json(
      { error: "memberId, accountNumber, bankCode, and accountName are required." },
      { status: 400 }
    );
  }

  const pm = upsertPaymentMethod({
    memberId: String(memberId),
    accountNumber: String(accountNumber),
    bankCode: String(bankCode),
    bankName: String(bankName ?? ""),
    accountName: String(accountName),
  });

  return NextResponse.json({ paymentMethod: pm }, { status: 201 });
}
