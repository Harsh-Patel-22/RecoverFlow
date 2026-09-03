"use client";

import React, { useState } from "react";
import { X, Zap, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { simulateSingleEvent } from "@/lib/api";

interface SingleEventDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FAILURE_CLASSES = [
  { id: "HARD_EXPIRED_CARD", label: "Expired Card", color: "bg-red-500/10 text-red-400 border-red-500/20", defaultAmt: 1499 },
  { id: "SOFT_INSUFFICIENT_FUNDS", label: "Insufficient Funds", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", defaultAmt: 499 },
  { id: "HARD_UPI_CAP_EXCEEDED", label: "UPI Limit Exceeded (>₹15k)", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", defaultAmt: 17900 },
  { id: "HARD_MANDATE_CANCELLED", label: "Mandate Cancelled", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", defaultAmt: 2999 },
  { id: "SOFT_BANK_BLOCKED", label: "Bank Blocked", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", defaultAmt: 999 },
  { id: "SOFT_NETWORK", label: "Network Timeout", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", defaultAmt: 199 },
  { id: "HARD_FRAUD_FLAGGED", label: "Fraud Flagged", color: "bg-red-600/10 text-red-500 border-red-600/20", defaultAmt: 25000 },
  { id: "AMBIGUOUS", label: "Ambiguous Decline Code", color: "bg-slate-500/10 text-slate-400 border-slate-500/20", defaultAmt: 4999 },
];

export const SingleEventDrawer: React.FC<SingleEventDrawerProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedClass, setSelectedClass] = useState("HARD_EXPIRED_CARD");
  const [customerName, setCustomerName] = useState("Arjun Sharma");
  const [planName, setPlanName] = useState("Pro Monthly");
  const [planAmount, setPlanAmount] = useState<number>(1499);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSelectClass = (cls: typeof FAILURE_CLASSES[0]) => {
    setSelectedClass(cls.id);
    setPlanAmount(cls.defaultAmt);
    if (cls.defaultAmt >= 15000) {
      setPlanName("Enterprise Quarterly");
    } else {
      setPlanName("Pro Monthly");
    }
  };

  const handleRunSimulation = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await simulateSingleEvent({
        failure_class: selectedClass,
        customer_name: customerName,
        plan_name: planName,
        plan_amount: planAmount,
      });
      setResult(res);
      onSuccess();
      setTimeout(() => {
        onClose();
        setResult(null);
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Webhook Playground</h3>
                <p className="text-xs text-slate-400">Simulate 1 Real-Time Failure Webhook</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Forms */}
          <div className="space-y-5">
            {/* Failure Class Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Select Failure Scenario
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FAILURE_CLASSES.map((cls) => {
                  const active = selectedClass === cls.id;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => handleSelectClass(cls)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                        active
                          ? `${cls.color} ring-1 ring-blue-500 font-bold scale-[1.02]`
                          : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {cls.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer Inputs */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={planAmount}
                  onChange={(e) => setPlanAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Simulation Result Box */}
            {result && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Real-Time Event Processed in &lt;200ms</span>
                </div>
                <div className="text-slate-300 space-y-1 pt-1 border-t border-emerald-500/20">
                  <p><span className="text-slate-400">Action Taken:</span> <strong className="text-white">{result.action_type}</strong></p>
                  <p><span className="text-slate-400">Recovery Channel:</span> <strong className="text-white">{result.recovery_channel}</strong></p>
                  {result.is_vip && (
                    <p><span className="text-amber-400 font-bold">★ VIP Account Flagged:</span> CSM Call Required</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Button */}
        <div className="pt-4 border-t border-slate-800 mt-6">
          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Webhook...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Fire Test Webhook Event</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
