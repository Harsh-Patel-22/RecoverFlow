"use client";

import Link from "next/link";
import { MessageSquare, ExternalLink, Clock, Copy, Check, Star, Layers, UserCheck } from "lucide-react";
import { FailingSubscriptionItem } from "@/lib/types";
import { useState } from "react";
import { assignToCSM } from "@/lib/api";
import { WaterfallModal } from "./WaterfallModal";

export default function RecoveryTable({ items }: { items: FailingSubscriptionItem[] }) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedWaterfall, setSelectedWaterfall] = useState<FailingSubscriptionItem | null>(null);
  const [csmAssignedIds, setCsmAssignedIds] = useState<Record<string, boolean>>({});

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const displayItems = items.slice(startIndex, startIndex + pageSize);

  const handleCopyLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAssignCSM = async (failureId: string) => {
    try {
      await assignToCSM(failureId);
      setCsmAssignedIds((prev) => ({ ...prev, [failureId]: true }));
    } catch (err) {
      console.error(err);
    }
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

  const getFailureBadge = (failureClass: string) => {
    switch (failureClass) {
      case "SOFT_INSUFFICIENT_FUNDS":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Soft: Insufficient Funds
          </span>
        );
      case "HARD_EXPIRED_CARD":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
            Hard: Expired Card
          </span>
        );
      case "HARD_MANDATE_CANCELLED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Hard: Mandate Cancelled
          </span>
        );
      case "SOFT_BANK_BLOCKED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
            Soft: Bank Blocked
          </span>
        );
      case "HARD_UPI_CAP_EXCEEDED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Hard: UPI Cap Exceeded
          </span>
        );
      case "SOFT_NETWORK":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">
            Soft: Network Failure
          </span>
        );
      case "HARD_FRAUD_FLAGGED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
            Hard: Fraud Flagged
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {failureClass || "AMBIGUOUS"}
          </span>
        );
    }
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
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Failing Subscriptions Queue</h3>
            <p className="text-xs text-slate-500">Live Razorpay webhook failures processed by RecoverFlow AI Agent</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <Link
              href="/audit"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0066FF] hover:text-[#0052CC] transition-colors"
            >
              <span>View Full Audit Trail</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Failure Class</th>
                <th className="py-3 px-4">Channel & Escalation</th>
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
                displayItems.map((item) => {
                  const { failure, recovery_action } = item;
                  const isVip = failure.plan_amount >= 20000 || recovery_action?.is_vip;
                  const isCsmAssigned = csmAssignedIds[failure.id] || recovery_action?.csm_status === "CSM_ASSIGNED";

                  return (
                    <tr key={failure.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{failure.customer_name}</span>
                          {isVip && (
                            <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded flex items-center gap-0.5" title="VIP Account (>₹20k contract)">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                              <span>VIP</span>
                            </span>
                          )}
                        </div>
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

                      {/* Channel & Escalation */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-600 font-bold uppercase">
                              {recovery_action?.recovery_channel || "NONE"}
                            </span>
                            <button
                              onClick={() => setSelectedWaterfall(item)}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1 transition-all"
                              title="Inspect Omnichannel Escalation Waterfall"
                            >
                              <Layers className="w-2.5 h-2.5" />
                              <span>Waterfall</span>
                            </button>
                          </div>

                          {isVip && (
                            <div>
                              {isCsmAssigned ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <UserCheck className="w-2.5 h-2.5" />
                                  <span>CSM Assigned</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleAssignCSM(failure.id)}
                                  className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 transition-colors"
                                  title="Assign account to Senior CSM for manual call outreach"
                                >
                                  Assign to CSM
                                </button>
                              )}
                            </div>
                          )}
                        </div>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Controls */}
        {items.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600 font-medium">
            <div>
              Showing <strong className="text-slate-900">{startIndex + 1}</strong> to{" "}
              <strong className="text-slate-900">{Math.min(startIndex + pageSize, items.length)}</strong> of{" "}
              <strong className="text-slate-900">{items.length}</strong> subscriptions
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={validPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-bold hover:bg-slate-100 disabled:opacity-40 transition-all"
              >
                Previous
              </button>
              <span className="font-mono text-slate-700">
                Page <strong>{validPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-bold hover:bg-slate-100 disabled:opacity-40 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Waterfall Modal */}
      <WaterfallModal
        item={selectedWaterfall}
        onClose={() => setSelectedWaterfall(null)}
      />
    </>
  );
}
