/**
 * POST /api/payments/payout
 *
 * Sends the full pot payout to a member's bank account via the Nomba Transfer API.
 * Idempotent — safe to retry; a duplicate reference returns the existing record.
 *
 * Body:
 *   groupId   string   — ID of the savings group
 *   memberId  string   — ID of the member receiving the payout
 *   round     number   — Current cycle round number
 *   amountNgn number   — Payout amount in NGN (converted to kobo internally)
 */

import { NextResponse } from "next/server";
import { sendTransfer, SUB_ACCOUNT_ID } from "@/lib/nomba/client";
import {
  getPaymentMethod,
  getPayoutRecord,
  listGroups,
  savePayoutRecord,
  updatePayoutStatus,
} from "@/lib/backend/store";

export async function POST(request: Request) {
  let body: {
    groupId?: string;
    memberId?: string;
    round?: number;
    amountNgn?: number;
  };
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

  // Find the group and member
  const groups = listGroups();
  const group = groups.find((g) => g.id === groupId);
  if (!group) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  const member = group.members.find((m) => m.id === memberId);
  if (!member) {
    return NextResponse.json({ error: "Member not found in group." }, { status: 404 });
  }

  // Ensure the member has a payment method on file
  const paymentMethod = getPaymentMethod(memberId);
  if (!paymentMethod) {
    return NextResponse.json(
      { error: "No bank account on file for this member." },
      { status: 422 }
    );
  }

  const reference = `payout:${groupId}:${round}`;
  const amountKobo = Math.round(amountNgn * 100);

  // Idempotency — return existing payout if already initiated
  const existing = getPayoutRecord(reference);
  if (existing) {
    return NextResponse.json({ payout: existing });
  }

  // Save an initial pending record before calling Nomba (prevents duplicate calls)
  const record = savePayoutRecord({
    reference,
    groupId,
    memberId,
    round,
    amountKobo,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  // Call Nomba Transfer API (scoped to sub-account)
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

    // Mark as failed so the caller knows to retry
    updatePayoutStatus(reference, "failed");

    return NextResponse.json(
      { error: "Transfer failed.", detail: message },
      { status: 502 }
    );
  }
}
