"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ShieldCheck, Cpu } from "lucide-react";
import { AuditLogEntry } from "@/lib/types";

export default function AuditLogComponent({ logs }: { logs: AuditLogEntry[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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
        second: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getEventBadge = (eventType: string) => {
    let color = "bg-blue-50 text-[#0066FF] border-blue-200";
    if (eventType === "CLASSIFIED") color = "bg-purple-50 text-purple-700 border-purple-200";
    if (eventType === "NOTIFICATION_SENT") color = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (eventType === "RETRY_SCHEDULED") color = "bg-[#EBF3FF] text-[#0066FF] border-blue-200";

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border ${color}`}>
        {eventType}
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            Agent Decision Audit Log
          </h3>
          <p className="text-xs text-slate-500">Immutable execution trail for failure classifications and recovery actions</p>
        </div>
        <span className="text-xs text-slate-500 font-mono">Showing {logs.length} entries</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4 w-10"></th>
              <th className="py-3 px-4">Timestamp (IST)</th>
              <th className="py-3 px-4">Subscription ID</th>
              <th className="py-3 px-4">Event Type</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Agent Reasoning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                  No audit log records found.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedId === log.id;
                return (
                  <>
                    <tr
                      key={log.id}
                      onClick={() => toggleExpand(log.id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatIST(log.event_timestamp)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {log.subscription_id}
                      </td>
                      <td className="py-3 px-4">{getEventBadge(log.event_type)}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{log.actor}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate font-medium">
                        {log.agent_reasoning ? (
                          <span className="text-purple-700 font-semibold flex items-center gap-1">
                            <Cpu className="w-3 h-3 inline text-purple-600" />
                            {log.agent_reasoning}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>

                    {/* Expandable JSON Detail Row */}
                    {isExpanded && (
                      <tr key={`detail-${log.id}`} className="bg-slate-900 text-white">
                        <td colSpan={6} className="p-4">
                          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 space-y-2">
                            <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-2">
                              Event Detail Payload (JSON)
                            </div>
                            <pre className="overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(log.event_detail, null, 2)}
                            </pre>
                            {log.agent_reasoning && (
                              <div className="mt-3 pt-3 border-t border-slate-800 text-purple-300 font-sans">
                                <strong>Agent Reasoning:</strong> {log.agent_reasoning}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
