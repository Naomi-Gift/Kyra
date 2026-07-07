"use client";
import { useState } from "react";
import { Search, Plus, Filter } from "lucide-react";
import { GroupsPanel } from "@/components/app/GroupsPanel";
import { CollectionCard } from "@/components/app/CollectionCard";
import { Button } from "@/components/ui/Button";
import { CreateGroupModal } from "@/components/app/CreateGroupModal";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { useAppData } from "@/components/app/AppDataProvider";
import type { SavingsGroup } from "@/lib/backend/types";

function formatMemberName(memberId: string): string {
  const stripped = memberId.startsWith("mem_") ? memberId.slice(4) : memberId;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

export default function GroupsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  const { virtualAccounts, groups } = useAppData();

  const collectingGroups = groups.filter((g) => g.status === "collecting");
  const hasActiveCollections = virtualAccounts.length > 0;

  return (
    <div className="space-y-5 px-4 pb-6 pt-20 sm:px-6 lg:p-8 lg:pt-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Groups</h1>
          <p className="text-white/35 text-sm font-sans mt-0.5">
            Manage your savings circles
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          New Group
        </Button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            type="text"
            placeholder="Search groups…"
            className="w-full glass rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/20 text-sm font-sans focus:outline-none border border-transparent focus:border-gold-500/30 transition-colors"
          />
        </div>
        <Button variant="outline" size="md" className="w-full sm:w-auto">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      <GroupsPanel onNewGroup={() => setCreateOpen(true)} />

      {/* Live collection cards — only shown when there are active virtual accounts */}
      {hasActiveCollections && collectingGroups.length > 0 && (
        <div className="space-y-5">
          <h2 className="font-serif text-xl font-semibold text-white">Active Collections</h2>
          {collectingGroups.map((group) => {
            const groupVAs = virtualAccounts.filter((va) => va.groupId === group.id);
            if (groupVAs.length === 0) return null;
            return (
              <div key={group.id} className="space-y-3">
                <h3 className="font-sans text-sm font-medium text-white/60 uppercase tracking-wider">
                  {group.name}
                </h3>
                <div className="space-y-2">
                  {groupVAs.map((va) => (
                    <CollectionCard
                      key={va.reference}
                      va={va}
                      memberName={formatMemberName(va.memberId)}
                      amountNgn={group.amount}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
