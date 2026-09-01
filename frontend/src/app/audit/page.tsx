"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import AuditLogComponent from "@/components/AuditLog";
import { fetchAuditLogs } from "@/lib/api";
import { AuditLogEntry } from "@/lib/types";

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchAuditLogs(100);
      setLogs(data);
    } catch (e) {
      console.error("Audit log load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar onBatchRunComplete={loadLogs} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 animate-fadeIn">
        <AuditLogComponent logs={logs} />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-medium">
        RecoverFlow • Razorpay AI Buildathon 2026 • AI Revenue Recovery Agent
      </footer>
    </div>
  );
}
