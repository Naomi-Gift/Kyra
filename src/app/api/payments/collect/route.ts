/**
 * POST /api/payments/collect
 *
 * Creates a Nomba virtual account for one member's contribution in a group cycle.
 * The member pays into this account; Nomba fires a webhook when funds arrive.
 *
 * Body:
 *   groupId   string   — ID of the savings group
 *   memberId  string   — ID of the member who needs to contribute
 *   round     number   — Current cycle round number
 */

import { NextResponse } from "next/server";
import { createVirtualAccount, SUB_ACCOUNT_ID } from "@/lib/nomba/client";
import {
  getVirtualAccountByReference,
  listGroups,
  saveVirtualAccount,
} from "@/lib/backend/store";

export async function POST(request: Request) {
  let body: { groupId?: string; memberId?: string; round?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { groupId, memberId, round } = body;

  if (!groupId || !memberId || round == null) {
    return NextResponse.json(
      { error: "groupId, memberId, and round are required." },
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

  // Build a stable reference — idempotent so re-requests return the same account
  const reference = `${groupId}:${round}:${memberId}`;

  // Return existing virtual account if already created for this reference
  const existing = getVirtualAccountByReference(reference);
  if (existing) {
    return NextResponse.json({ virtualAccount: existing });
  }

  // Create a new virtual account via Nomba (scoped to sub-account)
  try {
    const nombaRes = await createVirtualAccount({
      reference,
      accountName: `KYRA — ${group.name} — ${member.name}`,
      accountId: SUB_ACCOUNT_ID,
    });

    const va = saveVirtualAccount({
      reference,
      groupId,
      memberId,
      round,
      accountNumber: nombaRes.data.accountNumber,
      accountName: nombaRes.data.accountName,
      bankName: nombaRes.data.bankName,
      bankCode: nombaRes.data.bankCode,
    });

    return NextResponse.json({ virtualAccount: va }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[collect] Nomba API error:", message);
    return NextResponse.json(
      { error: "Failed to create virtual account.", detail: message },
      { status: 502 }
    );
  }
}
