"use client";
import { useEffect, useRef, useState } from "react";
import type { CollectionVirtualAccount, PayoutRecord } from "@/lib/backend/types";

type PaymentStatus = {
  virtualAccounts: CollectionVirtualAccount[];
  payoutRecords: PayoutRecord[];
  lastUpdated: string | null;
  loading: boolean;
};

export function usePaymentStatus(intervalMs = 4000): PaymentStatus {
  const [state, setState] = useState<PaymentStatus>({
    virtualAccounts: [],
    payoutRecords: [],
    lastUpdated: null,
    loading: true,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const poll = async () => {
      try {
        const res = await fetch("/api/payments/status");
        if (!mountedRef.current) return;
        if (res.ok) {
          const data = await res.json();
          setState({
            virtualAccounts: data.virtualAccounts ?? [],
            payoutRecords: data.payoutRecords ?? [],
            lastUpdated: data.lastUpdated ?? null,
            loading: false,
          });
        }
      } catch {
        // silently retry
      }
      if (mountedRef.current) {
        timeoutRef.current = setTimeout(poll, intervalMs);
      }
    };

    poll();

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [intervalMs]);

  return state;
}
