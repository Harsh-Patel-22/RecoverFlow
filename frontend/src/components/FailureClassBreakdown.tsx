"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MetricsData } from "@/lib/types";

const SHORT_NAMES: Record<string, string> = {
  SOFT_INSUFFICIENT_FUNDS: "Insuff. Funds",
  HARD_EXPIRED_CARD: "Expired Card",
  HARD_MANDATE_CANCELLED: "Mandate Cancelled",
  SOFT_BANK_BLOCKED: "Bank Blocked",
  HARD_UPI_CAP_EXCEEDED: "UPI Cap Exceeded",
  SOFT_NETWORK: "Network Glitch",
  HARD_FRAUD_FLAGGED: "Fraud Flagged",
  AMBIGUOUS: "Ambiguous",
};

const COLOR_MAP: Record<string, string> = {
  SOFT_INSUFFICIENT_FUNDS: "#10B981",
  SOFT_BANK_BLOCKED: "#10B981",
  SOFT_NETWORK: "#10B981",
  HARD_EXPIRED_CARD: "#EF4444",
  HARD_MANDATE_CANCELLED: "#EF4444",
  HARD_UPI_CAP_EXCEEDED: "#EF4444",
  HARD_FRAUD_FLAGGED: "#EF4444",
  AMBIGUOUS: "#64748B",
};

export default function FailureClassBreakdown({ metrics }: { metrics: MetricsData | null }) {
  const byClass = metrics?.failures_by_class || {};

  const data = Object.keys(SHORT_NAMES).map((key) => ({
    name: SHORT_NAMES[key],
    fullKey: key,
    count: byClass[key] || 0,
    color: COLOR_MAP[key] || "#0066FF",
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Failure Class Breakdown</h3>
          <p className="text-xs text-slate-500 mt-0.5">Distribution across 8 Razorpay failure taxonomy classes</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Soft (Retryable)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-600">Hard (Action Required)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="text-slate-600">Ambiguous</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
            <XAxis
              dataKey="name"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#07162C",
                borderColor: "#1E293B",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              }}
              formatter={(val: number) => [`${val} failures`, "Count"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
