/**
 * POST /api/webhooks/nomba
 *
 * Webhooks arrive without a session, so we look up which user owns the
 * virtual account / payout record by scanning all user stores via the
 * reference embedded in the event payload.
 *
 * Idempotency is enforced globally (processedWebhookRefs is shared).
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/nomba/client";
import {
  markVirtualAccountPaid,
  updatePayoutStatus,
  isWebhookProcessed,
  markWebhookProcessed,
  findUserIdForVirtualAccount,
  findUserIdForPayoutRecord,
} from "@/lib/backend/store";
import type { NombaWebhookEvent } from "@/lib/nomba/types";

export async function POST(request: NextRequest) {
  const rawBody  = await request.text();
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

  if (isWebhookProcessed(dedupeKey)) {
    console.log(`[webhook] Duplicate event skipped: ${dedupeKey}`);
    return NextResponse.json({ received: true });
  }

  console.log(`[webhook] ${event.event} | ref: ${reference}`);

  switch (event.event) {
    case "virtualaccount.credit":
    case "collection.credit": {
      const userId = findUserIdForVirtualAccount(reference);
      if (userId) {
        const va = markVirtualAccountPaid(userId, reference, createdAt ?? new Date().toISOString());
        if (va) {
          markWebhookProcessed(dedupeKey);
          console.log(`[webhook] Contribution confirmed — user: ${userId}, group: ${va.groupId}`);
        }
      } else {
        console.warn(`[webhook] No user found for VA ref: ${reference}`);
      }
      break;
    }

    case "payout.success": {
      const userId = findUserIdForPayoutRecord(reference);
      if (userId) {
        const record = updatePayoutStatus(userId, reference, "success", event.data.accountNumber);
        if (record) {
          markWebhookProcessed(dedupeKey);
          console.log(`[webhook] Payout confirmed — user: ${userId}, group: ${record.groupId}`);
        }
      }
      break;
    }

    case "payout.failed": {
      const userId = findUserIdForPayoutRecord(reference);
      if (userId) {
        const record = updatePayoutStatus(userId, reference, "failed");
        if (record) {
          markWebhookProcessed(dedupeKey);
          console.error(`[webhook] Payout FAILED — user: ${userId}, ref: ${reference}`);
        }
      }
      break;
    }

    default:
      console.log(`[webhook] Unhandled event: ${event.event}`);
  }

  return NextResponse.json({ received: true });
}
