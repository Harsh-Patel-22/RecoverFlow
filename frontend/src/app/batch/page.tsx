"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import BatchRunnerComponent from "@/components/BatchRunner";
import { fetchBatchResults } from "@/lib/api";
import { BatchResultData } from "@/lib/types";

export default function BatchPage() {
  const [initialData, setInitialData] = useState<BatchResultData | null>(null);

  useEffect(() => {
    fetchBatchResults()
      .then(setInitialData)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 animate-fadeIn">
        <BatchRunnerComponent initialData={initialData} />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-medium">
        RecoverFlow • Razorpay AI Buildathon 2026 • AI Revenue Recovery Agent
      </footer>
    </div>
  );
}
