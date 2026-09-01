"use client";

import { useEffect, useState } from "react";
import { fetchAuditLogs } from "@/lib/api";
import { AuditLogEntry } from "@/lib/types";

export default function LiveWebhookFeed() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    try {
      const data = await fetchAuditLogs(10);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatISTTime = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const dt = new Date(dateStr);
      return dt.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute inset-0 opacity-75" />
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Live Webhook Feed</h3>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">Auto-refreshes 5s</span>
      </div>

      <div className="space-y-2 font-mono text-xs max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
        {loading && logs.length === 0 ? (
          <div className="text-center py-6 text-slate-400">Connecting to live feed...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-6 text-slate-400">No recent webhook events.</div>
        ) : (
          logs.map((log) => {
            const detail = log.event_detail || {};
            const failureClass = detail.failure_class || detail.action_type || log.event_type;
            return (
              <div
                key={log.id}
                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-3 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-slate-400 text-[10px] whitespace-nowrap">
                    [{formatISTTime(log.event_timestamp)}]
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[#0066FF] text-[10px] font-bold uppercase">
                    {log.event_type}
                  </span>
                  <span className="text-slate-800 font-semibold text-xs truncate">{log.subscription_id}</span>
                </div>

                <div className="flex items-center gap-1 text-right whitespace-nowrap">
                  <span className="text-slate-400">→</span>
                  <span className="text-purple-700 font-bold text-[11px] truncate max-w-[150px]">
                    {failureClass}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
