import { NextResponse } from "next/server";
import { sendTransfer, SUB_ACCOUNT_ID } from "@/lib/nomba/client";
import {
  getPaymentMethod,
  getPayoutRecord,
  listGroups,
  resetPayoutForRetry,
  savePayoutRecord,
  updatePayoutStatus,
} from "@/lib/backend/store";

export async function POST(request: Request) {
  let body: { groupId?: string; memberId?: string; round?: number; amountNgn?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { groupId, memberId, round, amountNgn } = body;

  if (!groupId || !memberId || round == null || !amountNgn) {
    return NextResponse.json(
      { error: "groupId, memberId, round, and amountNgn are required." },
      { status: 400 }
    );
  }

  const groups = listGroups();
  const group = groups.find((g) => g.id === groupId);
  if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

  const member = group.members.find((m) => m.id === memberId);
  if (!member) return NextResponse.json({ error: "Member not found in group." }, { status: 404 });

  const paymentMethod = getPaymentMethod(memberId);
  if (!paymentMethod) {
    return NextResponse.json(
      { error: "No bank account on file for this member." },
      { status: 422 }
    );
  }

  const reference = `payout:${groupId}:${round}`;
  const amountKobo = Math.round(amountNgn * 100);

  // Idempotency — return existing record unless it's failed (retry path)
  const existing = getPayoutRecord(reference);
  if (existing) {
    if (existing.status !== "failed") {
      return NextResponse.json({ payout: existing });
    }
    // Retry: reset status to pending and re-call Nomba with same reference
    resetPayoutForRetry(reference);
  } else {
    // First attempt — save pending record BEFORE calling Nomba
    savePayoutRecord({
      reference,
      groupId,
      memberId,
      round,
      amountKobo,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
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
      reference,
      nombaRes.data.status === "success" ? "success" : "pending",
      nombaRes.data.sessionId
    );

    return NextResponse.json({ payout: updated }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[payout] Nomba API error:", message);
    updatePayoutStatus(reference, "failed");
    return NextResponse.json(
      { error: "Transfer failed.", detail: message },
      { status: 502 }
    );
  }
}
