import { NextResponse } from "next/server";
import { sendTransfer, SUB_ACCOUNT_ID } from "@/lib/nomba/client";
import { getPaymentMethod, getPayoutRecord, listGroups, resetPayoutForRetry, savePayoutRecord, updatePayoutStatus } from "@/lib/backend/store";
import { getUserId, UNAUTHORIZED } from "@/lib/backend/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED();

  let body: { groupId?: string; memberId?: string; round?: number; amountNgn?: number };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { groupId, memberId, round, amountNgn } = body;
  if (!groupId || !memberId || round == null || !amountNgn) {
    return NextResponse.json({ error: "groupId, memberId, round, and amountNgn are required." }, { status: 400 });
  }

  const groups = listGroups(userId);
  const group  = groups.find((g) => g.id === groupId);
  if (!group)  return NextResponse.json({ error: "Group not found." },  { status: 404 });

  const member = group.members.find((m) => m.id === memberId);
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  const paymentMethod = getPaymentMethod(userId, memberId);
  if (!paymentMethod) {
    return NextResponse.json({ error: "No bank account on file for this member." }, { status: 422 });
  }

  const reference  = `payout:${groupId}:${round}`;
  const amountKobo = Math.round(amountNgn * 100);

  const existing = getPayoutRecord(userId, reference);
  if (existing) {
    if (existing.status !== "failed") return NextResponse.json({ payout: existing });
    resetPayoutForRetry(userId, reference);
  } else {
    savePayoutRecord(userId, { reference, groupId, memberId, round, amountKobo, status: "pending", createdAt: new Date().toISOString() });
  }

  try {
    const nombaRes = await sendTransfer({
      reference,
      amount: amountKobo,
      beneficiaryAccountNumber: paymentMethod.accountNumber,
      beneficiaryBankCode: paymentMethod.bankCode,
      beneficiaryAccountName: paymentMethod.accountName,
      narration: `KYRA payout — ${group.name} round ${round}`,
      accountId: SUB_ACCOUNT_ID,
    });

    const updated = updatePayoutStatus(
      userId, reference,
      nombaRes.data.status === "success" ? "success" : "pending",
      nombaRes.data.sessionId
    );
    return NextResponse.json({ payout: updated }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[payout] Nomba API error:", message);
    updatePayoutStatus(userId, reference, "failed");
    return NextResponse.json({ error: "Transfer failed.", detail: message }, { status: 502 });
  }
}
