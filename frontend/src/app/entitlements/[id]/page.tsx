"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShieldAlert, Lock, AlertCircle, ArrowLeft, RefreshCw, Layers, Users, Download, Bot } from "lucide-react";
import Link from "next/link";

interface EntitlementStatus {
  subscription_id: string;
  tier: "GRACE_PERIOD" | "RESTRICTED_READ_ONLY" | "HARD_LOCKED";
  days_elapsed: number;
  can_access_app: boolean;
  restricted_features: string[];
  banner_text: string;
  customer_name: string;
  plan_name: string;
  plan_amount: number;
}

export default function EntitlementsDemoPage() {
  const params = useParams();
  const subId = (params?.id as string) || "sub_demo";
  const [data, setData] = useState<EntitlementStatus | null>(null);
  const [selectedTier, setSelectedTier] = useState<"GRACE_PERIOD" | "RESTRICTED_READ_ONLY" | "HARD_LOCKED">("RESTRICTED_READ_ONLY");

  const loadStatus = (tier?: string) => {
    fetch(`http://localhost:8000/entitlements/${subId}/status`)
      .then((res) => res.json())
      .then((d) => {
        if (tier) d.tier = tier;
        setData(d);
      })
      .catch(() => {
        setData({
          subscription_id: subId,
          tier: tier as any || "RESTRICTED_READ_ONLY",
          days_elapsed: 5,
          can_access_app: true,
          restricted_features: ["data_export", "ai_queries", "team_invites"],
          banner_text: "⚠️ Subscription Overdue (Day 5/7) — Advanced features are restricted. Complete payment to restore full access.",
          customer_name: "Harsh Patel",
          plan_name: "Growth Plan Quarterly",
          plan_amount: 17900.0,
        });
      });
  };

  useEffect(() => {
    loadStatus(selectedTier);
  }, [subId, selectedTier]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner (Simulated SaaS Application In-App Banner) */}
      {data?.tier === "GRACE_PERIOD" && (
        <div className="bg-blue-600/20 border-b border-blue-500/30 px-6 py-2.5 text-xs text-blue-300 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <span>{data.banner_text}</span>
          </div>
          <a
            href={`http://localhost:8000/checkout?amt=17900&customer=Harsh+Patel&plan=Growth+Plan&sub=${subId}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[11px] transition-all"
          >
            Renew Now
          </a>
        </div>
      )}

      {data?.tier === "RESTRICTED_READ_ONLY" && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-6 py-3 text-xs text-amber-200 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>{data.banner_text}</span>
          </div>
          <a
            href={`http://localhost:8000/checkout?amt=17900&customer=Harsh+Patel&plan=Growth+Plan&sub=${subId}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[11px] transition-all shadow-md"
          >
            Unlock Full Access
          </a>
        </div>
      )}

      {data?.tier === "HARD_LOCKED" && (
        <div className="bg-red-600/30 border-b border-red-500/40 px-6 py-3 text-xs text-red-200 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-400" />
            <span>{data.banner_text}</span>
          </div>
          <a
            href={`http://localhost:8000/checkout?amt=17900&customer=Harsh+Patel&plan=Growth+Plan&sub=${subId}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg text-[11px] transition-all shadow-md animate-pulse"
          >
            Pay Now to Unlock
          </a>
        </div>
      )}

      {/* Main SaaS App Simulation Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm">
              SaaS
            </div>
            <div>
              <h1 className="font-extrabold text-white text-base">In-App Entitlement Throttling Simulator</h1>
              <p className="text-xs text-slate-400">Simulating SaaS Application Feature Access Control</p>
            </div>
          </div>

          {/* Interactive Tier Switcher Tabs */}
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedTier("GRACE_PERIOD")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTier === "GRACE_PERIOD" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Day 1–3: Grace Period
            </button>
            <button
              onClick={() => setSelectedTier("RESTRICTED_READ_ONLY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTier === "RESTRICTED_READ_ONLY" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Day 4–7: Restricted Mode
            </button>
            <button
              onClick={() => setSelectedTier("HARD_LOCKED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTier === "HARD_LOCKED" ? "bg-red-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Day 8+: Hard Locked
            </button>
          </div>
        </div>
      </header>

      {/* Simulated SaaS App Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">SaaS Product Dashboard</h2>
            <p className="text-xs text-slate-400 mt-0.5">Subscriber Account: {data?.customer_name}</p>
          </div>
          <Link href="/" className="text-xs text-blue-400 hover:text-blue-300 font-bold underline">
            ← Return to RecoverFlow Dashboard
          </Link>
        </div>

        {/* Feature Cards Grid (Demonstrating Enabled vs Blocked State) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1: Core Dashboard Access */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <h3 className="font-bold text-white text-sm">Basic Analytics Dashboard</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standard metrics and subscription overview access remain accessible during Grace & Restricted modes.
            </p>
          </div>

          {/* Feature 2: Data Export (Disabled in Restricted Mode) */}
          <div
            className={`bg-slate-900 border rounded-2xl p-6 space-y-3 transition-all ${
              selectedTier !== "GRACE_PERIOD" ? "border-amber-500/40 opacity-60 relative" : "border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                <Download className="w-5 h-5" />
              </div>
              {selectedTier === "GRACE_PERIOD" ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ACTIVE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> RESTRICTED
                </span>
              )}
            </div>
            <h3 className="font-bold text-white text-sm">CSV & PDF Data Export</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-value data exports are automatically disabled on Day 4+ to prevent unpaid usage.
            </p>
          </div>

          {/* Feature 3: AI Queries & Team Invites */}
          <div
            className={`bg-slate-900 border rounded-2xl p-6 space-y-3 transition-all ${
              selectedTier !== "GRACE_PERIOD" ? "border-amber-500/40 opacity-60 relative" : "border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Bot className="w-5 h-5" />
              </div>
              {selectedTier === "GRACE_PERIOD" ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ACTIVE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> RESTRICTED
                </span>
              )}
            </div>
            <h3 className="font-bold text-white text-sm">AI Copilot & Team Invites</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Expensive LLM queries and team seats locked until e-mandate renewal is completed.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
