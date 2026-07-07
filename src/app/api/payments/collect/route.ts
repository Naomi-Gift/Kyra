import { NextResponse } from "next/server";
import { createVirtualAccount, SUB_ACCOUNT_ID } from "@/lib/nomba/client";
import { getVirtualAccountByReference, listGroups, saveVirtualAccount } from "@/lib/backend/store";
import { getUserId, UNAUTHORIZED } from "@/lib/backend/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED();

  let body: { groupId?: string; memberId?: string; round?: number };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { groupId, memberId, round } = body;
  if (!groupId || !memberId || round == null) {
    return NextResponse.json({ error: "groupId, memberId, and round are required." }, { status: 400 });
  }

  const groups = listGroups(userId);
  const group  = groups.find((g) => g.id === groupId);
  if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

  const member = group.members.find((m) => m.id === memberId);
  if (!member) return NextResponse.json({ error: "Member not found in group." }, { status: 404 });

  const reference = `${groupId}:${round}:${memberId}`;

  const existing = getVirtualAccountByReference(userId, reference);
  if (existing) return NextResponse.json({ virtualAccount: existing });

  try {
    const nombaRes = await createVirtualAccount({
      reference,
      accountName: `KYRA — ${group.name} — ${member.name}`,
      accountId: SUB_ACCOUNT_ID,
    });

    const va = saveVirtualAccount(userId, {
      reference, groupId, memberId, round,
      accountNumber: nombaRes.data.accountNumber,
      accountName:   nombaRes.data.accountName,
      bankName:      nombaRes.data.bankName,
      bankCode:      nombaRes.data.bankCode,
    });

    return NextResponse.json({ virtualAccount: va }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[collect] Nomba API error:", message);
    return NextResponse.json({ error: "Failed to create virtual account.", detail: message }, { status: 502 });
  }
}
