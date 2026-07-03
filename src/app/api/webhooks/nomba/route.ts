import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/nomba/client";
import {
  markVirtualAccountPaid,
  updatePayoutStatus,
  isWebhookProcessed,
  markWebhookProcessed,
} from "@/lib/backend/store";
import type { NombaWebhookEvent } from "@/lib/nomba/types";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("nomba-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn("[webhook] Invalid Nomba signature — rejected");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: NombaWebhookEvent;
  try {
    event = JSON.parse(rawBody) as NombaWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { reference, createdAt } = event.data;
  const dedupeKey = `${event.event}:${reference}`;

  // Idempotency — skip duplicate deliveries
  if (isWebhookProcessed(dedupeKey)) {
    console.log(`[webhook] Duplicate event skipped: ${dedupeKey}`);
    return NextResponse.json({ received: true });
  }

  console.log(`[webhook] ${event.event} | ref: ${reference}`);

  switch (event.event) {
    case "virtualaccount.credit":
    case "collection.credit": {
      const va = markVirtualAccountPaid(reference, createdAt ?? new Date().toISOString());
      if (va) {
        markWebhookProcessed(dedupeKey);
        console.log(`[webhook] Contribution confirmed — group: ${va.groupId}, member: ${va.memberId}, round: ${va.round}`);
      }
      break;
    }

    case "payout.success": {
      const record = updatePayoutStatus(reference, "success", event.data.accountNumber);
      if (record) {
        markWebhookProcessed(dedupeKey);
        console.log(`[webhook] Payout confirmed — group: ${record.groupId}, member: ${record.memberId}`);
      }
      break;
    }

    case "payout.failed": {
      const record = updatePayoutStatus(reference, "failed");
      if (record) {
        markWebhookProcessed(dedupeKey);
        console.error(`[webhook] Payout FAILED — group: ${record.groupId}, ref: ${reference}`);
      }
      break;
    }

    default:
      console.log(`[webhook] Unhandled event: ${event.event}`);
  }

  return NextResponse.json({ received: true });
}
