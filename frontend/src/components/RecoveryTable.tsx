"use client";

import Link from "next/link";
import { MessageSquare, ExternalLink, Clock } from "lucide-react";
import { FailingSubscriptionItem } from "@/lib/types";

export default function RecoveryTable({ items }: { items: FailingSubscriptionItem[] }) {
  const displayItems = items.slice(0, 20);

  const formatIST = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const dt = new Date(dateStr);
      return dt.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getFailureBadge = (fClass: string) => {
    if (!fClass) return <span className="text-slate-400">-</span>;
    let bg = "bg-slate-100 text-slate-700 border-slate-200";
    if (fClass.startsWith("SOFT_")) {
      bg = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    } else if (fClass.startsWith("HARD_")) {
      bg = "bg-rose-50 text-rose-700 border-rose-200/80";
    }
    const shortLabel = fClass.replace("SOFT_", "").replace("HARD_", "").replace(/_/g, " ");
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border ${bg}`}>
        {shortLabel}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    let bg = "bg-slate-100 text-slate-600 border-slate-200";
    if (status === "SENT" || status === "COMPLETED") {
      bg = "bg-emerald-50 text-emerald-700 border border-emerald-200";
    } else if (status === "PENDING") {
      bg = "bg-amber-50 text-amber-700 border border-amber-200";
    } else if (status === "HALTED" || status === "EXPIRED") {
      bg = "bg-rose-50 text-rose-700 border border-rose-200";
    }
    return (
      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase border ${bg}`}>
        {status || "PENDING"}
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Failing Subscriptions Queue</h3>
          <p className="text-xs text-slate-500 mt-0.5">Live Razorpay subscription failure events queued for AI recovery</p>
        </div>
        <Link
          href="/audit"
          className="text-xs font-bold text-[#0066FF] hover:text-[#0052CC] flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          <span>View Audit Trail</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Plan</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Failure Class</th>
              <th className="py-3 px-4">Channel</th>
              <th className="py-3 px-4">WhatsApp Link</th>
              <th className="py-3 px-4">Payment Link</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Timestamp (IST)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
            {displayItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                  No failing subscriptions found. Click "Run Batch (100)" to simulate events.
                </td>
              </tr>
            ) : (
              displayItems.map(({ failure, recovery_action }) => (
                <tr key={failure.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Customer */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{failure.customer_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{failure.subscription_id}</div>
                  </td>

                  {/* Plan */}
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {failure.plan_name}
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4 font-extrabold text-slate-900">
                    ₹{failure.plan_amount?.toLocaleString("en-IN")}
                  </td>

                  {/* Failure Class */}
                  <td className="py-3 px-4">
                    {getFailureBadge(recovery_action?.failure_class || "")}
                  </td>

                  {/* Channel */}
                  <td className="py-3 px-4">
                    <span className="text-[11px] text-slate-600 font-bold uppercase">
                      {recovery_action?.recovery_channel || "NONE"}
                    </span>
                  </td>

                  {/* WhatsApp Link */}
                  <td className="py-3 px-4">
                    {recovery_action?.whatsapp_deep_link ? (
                      <a
                        href={recovery_action.whatsapp_deep_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Open WhatsApp</span>
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Payment Link */}
                  <td className="py-3 px-4">
                    {recovery_action?.razorpay_payment_link ? (
                      <a
                        href={recovery_action.razorpay_payment_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Pay Now</span>
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {getStatusBadge(recovery_action?.status || "PENDING")}
                  </td>

                  {/* Timestamp */}
                  <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatIST(failure.failure_timestamp)}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
