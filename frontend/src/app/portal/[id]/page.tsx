"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, CreditCard, FileText, ExternalLink, ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface PortalData {
  subscription_id: string;
  customer_name: string;
  customer_email: string;
  plan_name: string;
  plan_amount: number;
  status: string;
  decline_reason: string;
  payment_link: string;
  gstin: string;
  invoices: { id: string; date: string; amount: number; status: string }[];
}

export default function CustomerPortalPage() {
  const params = useParams();
  const subId = (params?.id as string) || "sub_demo";
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/portal/${subId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Portal fetch failed");
        return res.json();
      })
      .then((d) => setData(d))
      .catch(() => {
        const cleanId = subId.replace(/[^a-zA-Z0-9_]/g, "");
        const shortId = cleanId.length > 6 ? cleanId.slice(-6) : cleanId;
        setData({
          subscription_id: subId,
          customer_name: `Subscriber (${shortId})`,
          customer_email: `billing-${shortId}@domain.com`,
          plan_name: "Subscription Plan",
          plan_amount: 17900.0,
          status: "pending",
          decline_reason: "Auto-debit mandate processing failure",
          payment_link: `http://localhost:8000/checkout?amt=17900&customer=Subscriber+${shortId}&plan=Subscription+Plan&sub=${subId}`,
          gstin: "27AAACB1234C1Z5",
          invoices: [
            { id: `INV-PREV-${shortId}`, date: "01 Jun 2026", amount: 17900.0, status: "PAID" },
            { id: `INV-CURR-${shortId}`, date: "01 Sep 2026", amount: 17900.0, status: "FAILED" },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, [subId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#091527] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-[#07111F]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-blue-600/30">
              RF
            </div>
            <div>
              <h1 className="font-extrabold text-white text-base tracking-tight">Customer Billing & Mandate Portal</h1>
              <p className="text-xs text-slate-400">Powered by RecoverFlow & Razorpay</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 space-y-8">
        {/* Account Status Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Payment Action Required
                </span>
                <span className="text-xs font-mono text-slate-400">{data?.subscription_id}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">{data?.plan_name}</h2>
              <p className="text-sm text-slate-400 mt-1">
                Subscriber: <strong className="text-slate-200">{data?.customer_name}</strong> ({data?.customer_email})
              </p>
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>Decline Reason: <strong>{data?.decline_reason}</strong></span>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
              <div className="text-left md:text-right">
                <span className="text-xs text-slate-400 font-medium">Renewal Amount</span>
                <div className="text-3xl font-black text-emerald-400">
                  ₹{data?.plan_amount.toLocaleString("en-IN")}
                </div>
              </div>

              <a
                href={data?.payment_link}
                target="_blank"
                rel="noreferrer"
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Pay Now via Razorpay
              </a>
            </div>
          </div>
        </div>

        {/* 2 Grid Section: Mandate Management & GSTIN Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Mandate & Payment Method */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Razorpay e-Mandate Management</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Re-authorize your UPI AutoPay e-mandate or update your primary credit/debit card to ensure seamless future monthly renewals.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`${data?.payment_link}#reauthorize`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 flex items-center justify-between transition-all"
              >
                <span>Re-authorize AutoPay Mandate</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a
                href={`${data?.payment_link}#update-card`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 flex items-center justify-between transition-all"
              >
                <span>Update Primary Payment Card</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Card 2: B2B GSTIN & Tax Invoice */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white text-base">Indian B2B GSTIN Tax Invoice</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Input Tax Credit (ITC) compliant B2B tax invoices with SAC Code 998313 and 18% GST (CGST/SGST/IGST) breakdown.
            </p>
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
              <div className="text-[10px] text-slate-500 font-extrabold uppercase">Registered GSTIN</div>
              <div className="text-xs font-mono font-bold text-blue-400">{data?.gstin}</div>
            </div>
            <a
              href={`http://localhost:8000/invoices/${subId}/gst-invoice`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold rounded-xl text-xs border border-purple-500/30 flex items-center justify-between transition-all"
            >
              <span>Download B2B GST Tax Invoice (PDF/HTML)</span>
              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
            </a>
          </div>
        </div>

        {/* Invoice History Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Billing History & Invoices</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-extrabold text-[10px]">
                  <th className="py-3 px-4">Invoice ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                {data?.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-200">{inv.id}</td>
                    <td className="py-3.5 px-4 text-slate-400">{inv.date}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">₹{inv.amount.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4">
                      {inv.status === "PAID" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          PAID
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                          FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={`http://localhost:8000/invoices/${subId}/gst-invoice`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 font-bold underline"
                      >
                        Download GST
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
