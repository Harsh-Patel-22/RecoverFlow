"use client";

import Link from "next/link";
import { MessageSquare, ExternalLink, Clock, Copy, Check } from "lucide-react";
import { FailingSubscriptionItem } from "@/lib/types";
import { useState } from "react";

export default function RecoveryTable({ items }: { items: FailingSubscriptionItem[] }) {
  const displayItems = items.slice(0, 20);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFormattedWhatsAppLink = (link: string | null) => {
    if (!link) return null;
    const demoPhone = process.env.NEXT_PUBLIC_DEMO_PHONE_NUMBER || "919104069628";
    if (demoPhone && demoPhone.trim()) {
      let cleanPhone = demoPhone.trim().replace("+", "");
      if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
      return link.replace(/wa\.me\/\d+/, `wa.me/${cleanPhone}`);
    }
    return link;
  };

  const getFormattedPaymentLink = (link: string | null, failure?: any) => {
    if (link && link.includes("/checkout")) {
      return link;
    }
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
    const amt = failure?.plan_amount || 500;
    const name = encodeURIComponent(failure?.customer_name || "Customer");
    const plan = encodeURIComponent(failure?.plan_name || "Subscription Renewal");
    const sub = failure?.subscription_id || "sub_demo";
    return `${backendUrl}/checkout?amt=${amt}&customer=${name}&plan=${plan}&sub=${sub}`;
  };

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
          <p className="text-xs text-slate-500 mt-0.5">Live Razorpay subscription failure events queued for AI agent recovery</p>
        </div>
        <Link
          href="/audit"
          className="text-xs font-bold text-[#0066FF] hover:text-[#0052CC] flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          <span>View Full Audit Trail</span>
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
              <th className="py-3 px-4">WhatsApp Recovery Action</th>
              <th className="py-3 px-4">Razorpay Payment Link</th>
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

                  {/* WhatsApp Action */}
                  <td className="py-3 px-4">
                    {recovery_action?.whatsapp_deep_link ? (
                      <a
                        href={getFormattedWhatsAppLink(recovery_action.whatsapp_deep_link) || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold shadow-sm transition-all"
                        title="Send pre-filled Hinglish recovery notice directly to customer via WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send WhatsApp Notice</span>
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Payment Link (Merchant Actions: Copy Link & Open Link) */}
                  <td className="py-3 px-4">
                    {recovery_action?.razorpay_payment_link ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyLink(failure.id, getFormattedPaymentLink(recovery_action.razorpay_payment_link, failure))}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-all"
                          title="Copy Razorpay payment link to clipboard to send via chat/email"
                        >
                          {copiedId === failure.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-600" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                        <a
                          href={getFormattedPaymentLink(recovery_action.razorpay_payment_link, failure)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all"
                          title="Preview Razorpay Checkout Page in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
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
