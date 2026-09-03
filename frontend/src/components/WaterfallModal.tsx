import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Clock, MessageSquare, Mail, Layers, Calendar, CheckCircle2, ShieldAlert, ArrowRight, Zap, CreditCard } from "lucide-react";
import { FailingSubscriptionItem } from "@/lib/types";

interface WaterfallModalProps {
  item: FailingSubscriptionItem | null;
  onClose: () => void;
}

export const WaterfallModal: React.FC<WaterfallModalProps> = ({ item, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!item || !mounted) return null;

  const { failure, recovery_action } = item;
  const failureClass = recovery_action?.failure_class || "UNKNOWN";
  const confidencePct = ((recovery_action?.classification_confidence || 1) * 100).toFixed(0);

  // Build dynamic waterfall steps based on the failure class
  const getDynamicSteps = () => {
    const baseSteps = [
      {
        time: "T+0 ms",
        title: "Razorpay Webhook Intake & AI Classification",
        desc: `Ingested payment failure event. Hybrid Classifier assigned '${failureClass}' with ${confidencePct}% confidence.`,
        icon: Layers,
        badge: "COMPLETED",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        nodeBg: "bg-emerald-500 text-white shadow-md shadow-emerald-500/20",
      },
    ];

    if (failureClass === "HARD_UPI_CAP_EXCEEDED") {
      baseSteps.push(
        {
          time: "T+0 ms",
          title: "RBI UPI ₹15,000 Cap Enforcement",
          desc: `Plan amount (₹${failure.plan_amount.toLocaleString("en-IN")}) exceeds RBI UPI limit. Payment link created with UPI auto-stripped to force Card & NetBanking.`,
          icon: CreditCard,
          badge: "ACTION TAKEN",
          badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
          nodeBg: "bg-purple-600 text-white shadow-md shadow-purple-600/20",
        },
        {
          time: "T+1 min",
          title: "Hinglish WhatsApp Recovery Link Sent",
          desc: `Direct notice dispatched to ${failure.customer_name} (+91 91040 69628) with 1-tap checkout link.`,
          icon: MessageSquare,
          badge: "DISPATCHED",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
          nodeBg: "bg-emerald-600 text-white shadow-md shadow-emerald-600/20",
        },
        {
          time: "T+24 Hours",
          title: "Email Dunning & Account Warning",
          desc: `Automated backup HTML email queued for ${failure.customer_email} if checkout link remains unpaid.`,
          icon: Mail,
          badge: "QUEUED",
          badgeColor: "bg-slate-100 text-slate-600 border-slate-200",
          nodeBg: "bg-slate-200 text-slate-600",
        }
      );
    } else if (failureClass === "SOFT_INSUFFICIENT_FUNDS") {
      baseSteps.push(
        {
          time: "T+1 min",
          title: "WhatsApp Friendly Balance Reminder",
          desc: `Dispatched conversational Hinglish balance alert with 1-click Razorpay payment link.`,
          icon: MessageSquare,
          badge: "DISPATCHED",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
          nodeBg: "bg-emerald-600 text-white shadow-md shadow-emerald-600/20",
        },
        {
          time: "Salary Day (28th / 1st)",
          title: "Automated Bank Auto-Pay Retry (APScheduler)",
          desc: "Cron scheduled to auto-charge e-mandate on salary credit day when bank balance peaks.",
          icon: Calendar,
          badge: "SCHEDULED",
          badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
          nodeBg: "bg-amber-500 text-white shadow-md shadow-amber-500/20",
        },
        {
          time: "T+7 Days",
          title: "Final Hard Grace Period Expiry",
          desc: "If unpaid by deadline, agent halts automated retries and flags account for manual CSM review.",
          icon: Clock,
          badge: "TIMED OUT",
          badgeColor: "bg-slate-100 text-slate-600 border-slate-200",
          nodeBg: "bg-slate-200 text-slate-600",
        }
      );
    } else if (failureClass === "HARD_EXPIRED_CARD") {
      baseSteps.push(
        {
          time: "T+1 min",
          title: "Card Update & Direct Payment Notice",
          desc: `Sent urgent WhatsApp & Email notice to ${failure.customer_name} with Card Update Deep Link (#update-card).`,
          icon: MessageSquare,
          badge: "DISPATCHED",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
          nodeBg: "bg-emerald-600 text-white shadow-md shadow-emerald-600/20",
        },
        {
          time: "T+48 Hours",
          title: "In-App Entitlement Throttling",
          desc: "Switches subscriber app access to Read-Only mode until card credentials are updated.",
          icon: ShieldAlert,
          badge: "STANDBY",
          badgeColor: "bg-slate-100 text-slate-600 border-slate-200",
          nodeBg: "bg-slate-200 text-slate-600",
        }
      );
    } else {
      baseSteps.push(
        {
          time: "T+1 min",
          title: "WhatsApp & Email Recovery Dispatch",
          desc: `Sent pre-filled payment link and recovery notice to ${failure.customer_name}.`,
          icon: MessageSquare,
          badge: "DISPATCHED",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
          nodeBg: "bg-emerald-600 text-white shadow-md shadow-emerald-600/20",
        },
        {
          time: "T+24 Hours",
          title: "Secondary Email Backup",
          desc: `Queued branded email backup to ${failure.customer_email}.`,
          icon: Mail,
          badge: "QUEUED",
          badgeColor: "bg-slate-100 text-slate-600 border-slate-200",
          nodeBg: "bg-slate-200 text-slate-600",
        }
      );
    }

    return baseSteps;
  };

  const steps = getDynamicSteps();

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Header Bar */}
        <div className="bg-[#07162C] text-white p-4 sm:p-5 flex items-start justify-between border-b border-slate-800 flex-none">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#0066FF]/20 text-[#38BDF8] border border-[#0066FF]/40 uppercase tracking-wider">
                Omnichannel Waterfall
              </span>
              <span className="text-xs text-slate-400 font-mono">{failure.subscription_id}</span>
            </div>
            <h3 className="font-extrabold text-white text-lg">{failure.customer_name}</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {failure.plan_name} • <strong className="text-emerald-400 font-extrabold">₹{failure.plan_amount.toLocaleString("en-IN")}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Body (Internal Bounded Scroll) */}
        <div className="flex-1 p-4 sm:p-5 bg-slate-50/50 overflow-y-auto space-y-4">
          <div className="relative pl-6 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {steps.map((st, idx) => {
              const Icon = st.icon;
              return (
                <div key={idx} className="relative flex items-start group">
                  {/* Timeline Icon Node */}
                  <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs ${st.nodeBg} ring-4 ring-white`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Content Card */}
                  <div className="ml-3 w-full bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-xs">{st.title}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {st.time}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${st.badgeColor}`}>
                          {st.badge}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{st.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-none">
          <span className="font-medium">100% Automated Decision Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
          >
            Close Timeline
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
