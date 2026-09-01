"use client";

import { useState } from "react";
import { Play, Zap, ShieldCheck, PieChart as PieIcon, Cpu } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { runBatch } from "@/lib/api";
import { BatchResultData } from "@/lib/types";

const ACTION_COLORS: Record<string, string> = {
  SCHEDULE_RETRY: "#0066FF",
  SEND_WHATSAPP: "#10B981",
  HALT_AND_NOTIFY: "#EF4444",
  NO_ACTION: "#64748B",
};

export default function BatchRunnerComponent({ initialData }: { initialData?: BatchResultData | null }) {
  const [count, setCount] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BatchResultData | null>(initialData || null);

  const handleExecuteBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await runBatch(count);
      setResult(res);
    } catch (err) {
      console.error("Batch execution error:", err);
    } finally {
      setLoading(false);
    }
  };

  const actionPieData = result
    ? Object.entries(result.by_action_type || {}).map(([key, val]) => ({
        name: key.replace(/_/g, " "),
        value: val,
        color: ACTION_COLORS[key] || "#0066FF",
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Play className="w-5 h-5 text-[#0066FF]" />
              Synthetic Subscription Failure Batch Simulator
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Simulate 100+ production-shaped Razorpay payment failures to evaluate classification accuracy, recovery rate & audit trails.
            </p>
          </div>

          <form onSubmit={handleExecuteBatch} className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className="text-xs font-semibold text-slate-600">Batch Count:</span>
              <input
                type="number"
                min={10}
                max={200}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-16 bg-transparent text-slate-900 font-bold text-sm focus:outline-none text-right"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs shadow-md shadow-[#0066FF]/20 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Execute Batch (100)</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Processing Stats Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#38BDF8]" />
              <span>Evaluated <strong className="text-white">{result.total_processed}</strong> synthetic subscriptions in <strong className="text-emerald-400">{result.processing_time_seconds}s</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Audit logs created: <strong className="text-white">{result.audit_entries_created}</strong></span>
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Batch MRR at Risk</span>
              <div className="text-2xl font-extrabold text-rose-600 mt-2">
                ₹{result.total_mrr_at_risk?.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Batch MRR Recovered</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-2">
                ₹{result.total_mrr_recovered?.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Batch Recovery Rate</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">
                {result.recovery_rate}%
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Subscriptions Evaluated</span>
              <div className="text-2xl font-extrabold text-[#0066FF] mt-2">
                {result.total_processed}
              </div>
            </div>
          </div>

          {/* Breakdown Table & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Failure Class Breakdown Table */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Failure Class Metrics</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-2.5 px-3">Failure Class</th>
                      <th className="py-2.5 px-3">Count</th>
                      <th className="py-2.5 px-3">MRR at Risk</th>
                      <th className="py-2.5 px-3">MRR Recovered</th>
                      <th className="py-2.5 px-3">Recovery Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {Object.entries(result.by_failure_class || {}).map(([cls, info]) => {
                      const rate = info.mrr > 0 ? ((info.recovered / info.mrr) * 100).toFixed(1) : "0.0";
                      return (
                        <tr key={cls} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{cls}</td>
                          <td className="py-2.5 px-3">{info.count}</td>
                          <td className="py-2.5 px-3 text-rose-600 font-bold">₹{info.mrr?.toLocaleString("en-IN")}</td>
                          <td className="py-2.5 px-3 text-emerald-600 font-bold">₹{info.recovered?.toLocaleString("en-IN")}</td>
                          <td className="py-2.5 px-3 font-extrabold text-slate-900">{rate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Distribution Donut Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-[#0066FF]" />
                  Action Distribution
                </h3>
                <p className="text-xs text-slate-500 mb-4">Rescue actions selected by agent</p>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={actionPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {actionPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#07162C",
                          borderColor: "#1E293B",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t border-slate-200 text-xs">
                {actionPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
