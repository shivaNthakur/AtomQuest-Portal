"use client";

import { useCallback, useEffect, useState } from "react";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { CompletionTable } from "@/components/admin/CompletionTable";
import { api } from "@/lib/fetcher";
import { useRealTimeSync } from "@/hooks/useRealTimeSync";

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<Parameters<typeof AnalyticsDashboard>[0]["data"] | null>(null);
  const [completion, setCompletion] = useState<{
    rows: never[];
    summary: { totalEmployees: number; employeesCompleted: number; managersCompleted: number };
  } | null>(null);
  const [cycleId, setCycleId] = useState("");
  const [cycles, setCycles] = useState<{ id: string; phase: string; year: number; isActive: boolean }[]>([]);

  const load = useCallback(async () => {
    const [a, c] = await Promise.all([
      api<Parameters<typeof AnalyticsDashboard>[0]["data"]>("/api/reports/analytics"),
      api<{ cycles: typeof cycles }>("/api/cycles"),
    ]);
    setAnalytics(a);
    setCycles(c.cycles);
    const cid = cycleId || c.cycles.find((x) => x.phase === "Q1" && x.isActive)?.id || c.cycles[0]?.id || "";
    if (!cycleId && cid) setCycleId(cid);
    if (cid) {
      const comp = await api<NonNullable<typeof completion>>(
        `/api/reports/completion?cycleId=${cid}`
      );
      setCompletion(comp);
    }
  }, [cycleId]);

  useEffect(() => {
    load();
  }, [load]);

  useRealTimeSync({
    goals_submitted: () => load(),
    achievement_logged: () => load(),
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
          <p className="text-slate-500 text-sm">Analytics, completion rates, and exports</p>
        </div>
        <select
          value={cycleId}
          onChange={(e) => setCycleId(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          {cycles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.year} — {c.phase}
            </option>
          ))}
        </select>
      </div>

      {analytics && <AnalyticsDashboard data={analytics} />}
      {completion && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Completion status</h2>
          <CompletionTable
            rows={completion.rows}
            summary={completion.summary}
          />
        </section>
      )}
    </div>
  );
}
