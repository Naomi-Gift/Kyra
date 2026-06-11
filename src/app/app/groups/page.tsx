"use client";
import { useState } from "react";
import { Search, Plus, Filter } from "lucide-react";
import { GroupsPanel } from "@/components/app/GroupsPanel";
import { Button } from "@/components/ui/Button";
import { CreateGroupModal } from "@/components/app/CreateGroupModal";

export default function GroupsPage() {
  const [createOpen, setCreateOpen] = useState(false);

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

      <GroupsPanel />

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
