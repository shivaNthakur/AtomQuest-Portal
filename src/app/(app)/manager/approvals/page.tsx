"use client";

import { useCallback, useEffect, useState } from "react";
import { ApprovalPanel } from "@/components/manager/ApprovalPanel";
import { api } from "@/lib/fetcher";
import { useRealTimeSync } from "@/hooks/useRealTimeSync";

export default function ManagerApprovalsPage() {
  const [cycleId, setCycleId] = useState("");
  const [cycles, setCycles] = useState<{ id: string; phase: string; year: number }[]>([]);
  const [team, setTeam] = useState([]);

  const load = useCallback(async () => {
    const c = await api<{ cycles: { id: string; phase: string; year: number; isActive: boolean }[] }>("/api/cycles");
    setCycles(c.cycles);
    const cid = cycleId || c.cycles.find((x) => x.phase === "GOAL_SETTING")?.id || c.cycles[0]?.id || "";
    if (!cycleId && cid) setCycleId(cid);
    if (cid) {
      const t = await api<{ byEmployee: never[] }>(`/api/goals/team?cycleId=${cid}`);
      setTeam(t.byEmployee);
    }
  }, [cycleId]);

  useEffect(() => {
    load();
  }, [load]);

  useRealTimeSync({ goals_submitted: () => load() });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Goal approvals</h1>
          <p className="text-slate-500 text-sm">Review, edit inline, approve or return goals</p>
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
      <ApprovalPanel team={team} onRefresh={load} />
    </div>
  );
}
