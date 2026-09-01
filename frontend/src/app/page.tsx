"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import MetricsCards from "@/components/MetricsCards";
import FailureClassBreakdown from "@/components/FailureClassBreakdown";
import RecoveryTable from "@/components/RecoveryTable";
import LiveWebhookFeed from "@/components/LiveWebhookFeed";
import { fetchMetrics, fetchFailingSubscriptions } from "@/lib/api";
import { MetricsData, FailingSubscriptionItem } from "@/lib/types";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [failingSubs, setFailingSubs] = useState<FailingSubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [m, subs] = await Promise.all([
        fetchMetrics().catch(() => null),
        fetchFailingSubscriptions().catch(() => []),
      ]);
      if (m) setMetrics(m);
      setFailingSubs(subs);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const mInterval = setInterval(() => {
      fetchMetrics().then(setMetrics).catch(() => {});
    }, 10000);

    const sInterval = setInterval(() => {
      fetchFailingSubscriptions().then(setFailingSubs).catch(() => {});
    }, 15000);

    return () => {
      clearInterval(mInterval);
      clearInterval(sInterval);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar onBatchRunComplete={loadData} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6 animate-fadeIn">
        {/* Section 1: KPI Metrics Cards */}
        <MetricsCards metrics={metrics} />

        {/* Section 2: Failure Class Breakdown Chart & Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FailureClassBreakdown metrics={metrics} />
          </div>
          <div>
            <LiveWebhookFeed />
          </div>
        </div>

        {/* Section 3: Live Failing Subscriptions Table */}
        <RecoveryTable items={failingSubs} />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-medium">
        RecoverFlow • Razorpay AI Buildathon 2026 • AI Revenue Recovery Agent
      </footer>
    </div>
  );
}
