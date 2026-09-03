"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Play, Activity, ShieldCheck, RefreshCw, Zap, Settings } from "lucide-react";
import { useState } from "react";
import { runBatch } from "@/lib/api";
import { SingleEventDrawer } from "./SingleEventDrawer";
import { CampaignSettingsModal } from "./CampaignSettingsModal";

export default function Navbar({ onBatchRunComplete }: { onBatchRunComplete?: () => void }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleRunBatch = async () => {
    try {
      setLoading(true);
      await runBatch(100);
      if (onBatchRunComplete) onBatchRunComplete();
    } catch (err) {
      console.error("Batch execution error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="bg-[#07162C] border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left Section: Brand & Razorpay Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              {/* Razorpay Brand Icon */}
              <div className="w-8 h-8 rounded-md bg-[#0066FF] flex items-center justify-center shadow-md shadow-[#0066FF]/30 group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M12.5 2L4.5 22h4.5l2.5-6.5h6.5l1.5-4h-6.5l2.5-6.5h2.5z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-white font-sans">RecoverFlow</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0066FF]/20 text-[#38BDF8] border border-[#0066FF]/40">
                    AI Revenue Rescue
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium -mt-0.5">Razorpay AI Buildathon 2026</span>
              </div>
            </Link>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            {/* Test Mode Badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded text-amber-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Razorpay Test Mode</span>
            </div>
          </div>

          {/* Center & Right Navigation */}
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center bg-[#0F172A] p-1 rounded-lg border border-slate-800">
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  pathname === "/"
                    ? "bg-[#0066FF] text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Dashboard
              </Link>
              <Link
                href="/batch"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  pathname === "/batch"
                    ? "bg-[#0066FF] text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Batch Simulator
              </Link>
              <Link
                href="/audit"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  pathname === "/audit"
                    ? "bg-[#0066FF] text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Audit Logs
              </Link>
            </nav>

            {/* Simulate 1 Event Sandbox Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all"
              title="Simulate 1 isolated failure webhook in real time"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Simulate 1 Event</span>
            </button>

            {/* Campaign Settings Gear Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Configure campaign tone & discounts"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Run Batch Trigger Button */}
            <button
              onClick={handleRunBatch}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] active:scale-95 text-white font-bold text-xs shadow-md shadow-[#0066FF]/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Running Agent...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run Batch (100)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Drawer & Campaign Settings Modal */}
      <SingleEventDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => {
          if (onBatchRunComplete) onBatchRunComplete();
        }}
      />

      <CampaignSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => {
          if (onBatchRunComplete) onBatchRunComplete();
        }}
      />
    </>
  );
}
