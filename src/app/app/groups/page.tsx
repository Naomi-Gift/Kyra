"use client";
import { useState } from "react";
import { Search, Plus, Filter } from "lucide-react";
import { GroupsPanel } from "@/components/app/GroupsPanel";
import { Button } from "@/components/ui/Button";
import { CreateGroupModal } from "@/components/app/CreateGroupModal";

export default function GroupsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Groups</h1>
          <p className="text-white/35 text-sm font-sans mt-0.5">
            Manage your savings circles
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          New Group
        </Button>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            type="text"
            placeholder="Search groups…"
            className="w-full glass rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/20 text-sm font-sans focus:outline-none border border-transparent focus:border-gold-500/30 transition-colors"
          />
        </div>
        <Button variant="outline" size="md">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      <GroupsPanel />

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
