"use client";

import { useCallback, useEffect, useState } from "react";
import { CompletionTable } from "@/components/admin/CompletionTable";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";
import { useRealTimeSync } from "@/hooks/useRealTimeSync";

export default function ManagerDashboardPage() {
  const [cycleId, setCycleId] = useState("");
  const [cycles, setCycles] = useState<{ id: string; phase: string; year: number }[]>([]);
  const [data, setData] = useState<{
    rows: never[];
    summary: { totalEmployees: number; employeesCompleted: number; managersCompleted: number };
  } | null>(null);

  const load = useCallback(async () => {
    const c = await api<{ cycles: { id: string; phase: string; year: number; isActive: boolean }[] }>("/api/cycles");
    const active = c.cycles.filter((x) => x.isActive && x.phase !== "GOAL_SETTING");
    setCycles(active.length ? active : c.cycles);
    const cid = cycleId || active[0]?.id || "";
    if (!cycleId && cid) setCycleId(cid);
    if (cid) {
      const r = await api<typeof data>(`/api/reports/completion?cycleId=${cid}`);
      setData(r);
    }
  }, [cycleId]);

  useEffect(() => {
    load();
  }, [load]);

  useRealTimeSync({ achievement_logged: () => load(), checkin_added: () => load() });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team dashboard</h1>
          <p className="text-slate-500 text-sm">Check-in completion across your team</p>
        </div>
        <div className="flex gap-2">
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
          <a
            href={`/api/reports/achievement?cycleId=${cycleId}`}
            className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium hover:bg-slate-50 transition hover:shadow-sm"
          >
            Export Excel
          </a>
          <a
            href={`/api/reports/achievement/csv?cycleId=${cycleId}`}
            className="inline-flex h-10 items-center rounded-lg border border-teal-200 bg-teal-50 text-teal-800 px-4 text-sm font-medium hover:bg-teal-100 transition"
          >
            Export CSV
          </a>
        </div>
      </div>
      {data && <CompletionTable rows={data.rows} summary={data.summary} />}
    </div>
  );
}
