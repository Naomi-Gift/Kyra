"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", saved: 4800,   members: 120  },
  { month: "Feb", saved: 12400,  members: 210  },
  { month: "Mar", saved: 28000,  members: 380  },
  { month: "Apr", saved: 52000,  members: 580  },
  { month: "May", saved: 94000,  members: 840  },
  { month: "Jun", saved: 145000, members: 1050 },
  { month: "Jul", saved: 218000, members: 1180 },
  { month: "Aug", saved: 312500, members: 1247 },
];

type Range = "3M" | "6M" | "All";

const ranges: Range[] = ["3M", "6M", "All"];
const rangeSlice: Record<Range, number> = { "3M": 3, "6M": 6, "All": 8 };

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="glass rounded-xl p-3 border border-white/10 shadow-card min-w-[130px]"
    >
      <p className="text-white/40 text-xs font-sans mb-1">{label}</p>
      <p className="text-gold-400 font-serif font-bold text-lg">${payload[0].value.toLocaleString()}</p>
      {payload[1] && (
        <p className="text-violet-400 text-xs font-sans mt-0.5">{payload[1].value.toLocaleString()} members</p>
      )}
    </motion.div>
  );
};

export function SavingsChart() {
  const [range, setRange] = useState<Range>("All");
  const sliced = data.slice(data.length - rangeSlice[range]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-2xl p-6 space-y-4 border border-white/6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-white">Savings Growth</h3>
          <p className="text-white/30 text-xs font-sans">Total cUSD saved across all groups</p>
        </div>
        <div className="flex items-center gap-1 glass rounded-lg p-1">
          {ranges.map((r) => (
            <motion.button
              key={r}
              onClick={() => setRange(r)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className={`relative px-3 py-1 rounded-md text-xs font-sans transition-colors ${
                range === r ? "text-white" : "text-white/35 hover:text-white/60"
              }`}
            >
              {range === r && (
                <motion.span
                  layoutId="rangeActive"
                  className="absolute inset-0 rounded-md bg-white/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{r}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs font-sans text-white/30">
        <span className="flex items-center gap-1.5">
          <span className="w-8 h-px bg-gold-400 inline-block" /> Savings
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-8 h-px bg-violet-400 inline-block" /> Members
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={sliced} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#fbbf24" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="violetFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="saved"   stroke="#fbbf24" strokeWidth={2}   fill="url(#goldFill)"   dot={false} activeDot={{ r: 5, fill: "#fbbf24", strokeWidth: 0 }} />
          <Area type="monotone" dataKey="members" stroke="#8b5cf6" strokeWidth={1.5} fill="url(#violetFill)" dot={false} activeDot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
