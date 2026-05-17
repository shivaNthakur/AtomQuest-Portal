"use client";

import { useCallback, useEffect, useState } from "react";
import { AchievementForm } from "@/components/employee/AchievementForm";
import { api } from "@/lib/fetcher";
import { useRealTimeSync } from "@/hooks/useRealTimeSync";

type Cycle = { id: string; phase: string; year: number; isActive: boolean };
type Goal = {
  id: string;
  title: string;
  target: number;
  uomType: string;
  status: string;
  targetDate?: string | null;
  thrustArea: { name: string };
};

export default function EmployeeAchievementsPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cycleId, setCycleId] = useState("");
  const [goals, setGoals] = useState<
    (Goal & { achievements?: { actualValue: number; status: string; computedScore?: number | null }[] })[]
  >([]);

  const load = useCallback(async () => {
    const c = await api<{ cycles: Cycle[] }>("/api/cycles");
    const checkinCycles = c.cycles.filter(
      (x) => x.phase !== "GOAL_SETTING" && x.isActive
    );
    setCycles(checkinCycles.length ? checkinCycles : c.cycles);
    const cid =
      cycleId ||
      checkinCycles[0]?.id ||
      c.cycles.find((x) => x.phase === "Q1")?.id ||
      "";
    if (!cycleId && cid) setCycleId(cid);
    if (!cid) return;

    const [gRes, aRes] = await Promise.all([
      api<{ goals: Goal[] }>(`/api/goals?cycleId=${cid}`),
      api<{
        achievements: {
          goalId: string;
          actualValue: number;
          status: string;
          computedScore?: number | null;
        }[];
      }>(`/api/achievements?cycleId=${cid}`),
    ]);

    const locked = gRes.goals.filter((g) => g.status === "LOCKED");
    const merged = locked.map((goal) => ({
      ...goal,
      achievements: aRes.achievements.filter((a) => a.goalId === goal.id),
    }));
    setGoals(merged);
  }, [cycleId]);

  useEffect(() => {
    load();
  }, [load]);

  useRealTimeSync({ achievement_logged: () => load() });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quarterly achievements</h1>
          <p className="text-slate-500 text-sm">Log actuals against planned targets</p>
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
      {cycleId && goals.length > 0 && (
        <AchievementForm goals={goals} cycleId={cycleId} onSaved={load} />
      )}
      {cycleId && goals.length === 0 && (
        <p className="text-slate-500 text-center py-12">
          No locked goals for this cycle. Complete goal approval first.
        </p>
      )}
    </div>
  );
}
