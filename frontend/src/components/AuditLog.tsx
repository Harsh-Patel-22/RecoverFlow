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

                    {/* Expandable Intuitive Detail Row */}
                    {isExpanded && (
                      <tr key={`detail-${log.id}`} className="bg-slate-900/95 text-slate-100">
                        <td colSpan={6} className="p-5">
                          <div className="bg-[#0B1528] p-5 rounded-xl border border-slate-800 space-y-4">
                            {/* Header info */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event ID:</span>
                                <span className="font-mono text-xs text-blue-400 font-bold">{log.id}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-slate-400">Actor: <strong className="text-white">{log.actor}</strong></span>
                                <span className="text-slate-400">Time: <strong className="text-slate-200">{formatIST(log.event_timestamp)}</strong></span>
                              </div>
                            </div>

                            {/* Agent Reasoning Banner if available */}
                            {log.agent_reasoning && (
                              <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-200 flex items-start gap-2.5">
                                <Cpu className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-extrabold text-purple-300 uppercase text-[10px] tracking-wider mb-0.5">
                                    AI Agent Reasoning & Strategy
                                  </div>
                                  <p className="leading-relaxed text-purple-100">{log.agent_reasoning}</p>
                                </div>
                              </div>
                            )}

                            {/* Intuitive Key-Value Visual Grid */}
                            <div>
                              <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2.5">
                                Executive Event Summary
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                {Object.entries(log.event_detail || {}).map(([key, val]) => {
                                  let valStr = "";
                                  if (typeof val === "object" && val !== null) {
                                    valStr = JSON.stringify(val);
                                  } else {
                                    valStr = String(val);
                                  }

                                  const isLink = valStr.startsWith("http://") || valStr.startsWith("https://");

                                  return (
                                    <div
                                      key={key}
                                      className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1"
                                    >
                                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        {key.replace(/_/g, " ")}
                                      </div>
                                      {isLink ? (
                                        <a
                                          href={valStr}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-blue-400 font-mono text-xs underline truncate block hover:text-blue-300"
                                        >
                                          {valStr}
                                        </a>
                                      ) : (
                                        <div className="font-semibold text-slate-200 font-mono text-xs break-words">
                                          {valStr}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
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
