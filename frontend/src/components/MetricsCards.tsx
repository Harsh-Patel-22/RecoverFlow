"use client";

import { AlertCircle, CheckCircle2, TrendingUp, Cpu } from "lucide-react";
import { MetricsData } from "@/lib/types";

export default function MetricsCards({ metrics }: { metrics: MetricsData | null }) {
  const formatRupees = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Card 1: Total MRR at Risk */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total MRR at Risk</span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
            {formatRupees(metrics?.total_mrr_at_risk_rupees || 0)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Failed Razorpay subscription debits</p>
        </div>
      </div>

      {/* Card 2: MRR Recovered */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">MRR Recovered</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
            {formatRupees(metrics?.total_mrr_recovered_rupees || 0)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Rescued via AI agent actions</p>
        </div>
      </div>

      {/* Card 3: Recovery Rate */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recovery Rate</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0066FF]">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {(metrics?.overall_recovery_rate_percent || 0).toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Target benchmark: 45%–65%</p>
        </div>
      </div>

      {/* Card 4: Failures Processed */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Failures Evaluated</span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {metrics?.total_failures_processed || 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Hybrid rule + Claude LLM</p>
        </div>
      </div>
    </div>
  );
}
