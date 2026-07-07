import { NextResponse } from "next/server";
import { createGroup, listGroups } from "@/lib/backend/store";
import { getUserId, UNAUTHORIZED } from "@/lib/backend/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED();
  return NextResponse.json({ groups: listGroups(userId) }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return UNAUTHORIZED();

  const body = await request.json();
  if (!body.name || !body.amount || !body.cycleDays || !Array.isArray(body.members)) {
    return NextResponse.json({ error: "Missing required group fields." }, { status: 400 });
  }

  const group = createGroup(userId, {
    name: String(body.name),
    amount: Number(body.amount),
    cycleDays: Number(body.cycleDays),
    members: body.members.map((member: { name?: string; email?: string }) => ({
      name: String(member.name ?? ""),
      email: String(member.email ?? ""),
    })),
  });

  return NextResponse.json({ group }, { status: 201 });
}
