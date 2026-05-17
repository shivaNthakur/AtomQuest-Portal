"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";
import { useRealTimeSync } from "@/hooks/useRealTimeSync";

export default function ManagerCheckinsPage() {
  const [cycleId, setCycleId] = useState("");
  const [cycles, setCycles] = useState<{ id: string; phase: string; year: number; isActive: boolean }[]>([]);
  const [team, setTeam] = useState<
    {
      employee: { name: string; department: string | null };
      rows: {
        goal: { id: string; title: string; target: number };
        achievement?: { id: string; actualValue: number; status: string };
        scorePercent: number | null;
        hasCheckin: boolean;
      }[];
      completionRate: number;
    }[]
  >([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const c = await api<{ cycles: typeof cycles }>("/api/cycles");
    const active = c.cycles.filter((x) => x.phase !== "GOAL_SETTING" && x.isActive);
    setCycles(active.length ? active : c.cycles);
    const cid = cycleId || active[0]?.id || c.cycles.find((x) => x.phase === "Q1")?.id || "";
    if (!cycleId && cid) setCycleId(cid);
    if (cid) {
      const t = await api<{ team: typeof team }>(`/api/checkins/team?cycleId=${cid}`);
      setTeam(t.team);
    }
  }, [cycleId]);

  useEffect(() => {
    load();
  }, [load]);

  useRealTimeSync({ achievement_logged: () => load() });

  const addCheckin = async (achievementId: string) => {
    const comment = comments[achievementId];
    if (!comment?.trim()) return;
    setBusy(achievementId);
    try {
      await api("/api/checkins", {
        method: "POST",
        body: JSON.stringify({ achievementId, cycleId, comment }),
      });
      setComments((p) => ({ ...p, [achievementId]: "" }));
      load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team check-ins</h1>
          <p className="text-slate-500 text-sm">Planned vs actual and structured comments</p>
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

      {team.map((member) => (
        <div key={member.employee.name} className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b flex justify-between">
            <div>
              <h3 className="font-semibold">{member.employee.name}</h3>
              <p className="text-xs text-slate-500">{member.employee.department}</p>
            </div>
            <span className="text-sm text-brand-600 font-medium">
              {member.completionRate}% logged
            </span>
          </div>
          <div className="divide-y">
            {member.rows.map((row) => (
              <div key={row.goal.id} className="p-4 grid gap-3 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-4">
                  <p className="font-medium text-sm">{row.goal.title}</p>
                  <p className="text-xs text-slate-500">
                    Target: {row.goal.target}
                    {row.achievement && ` · Actual: ${row.achievement.actualValue}`}
                  </p>
                </div>
                <div className="lg:col-span-2 text-sm">
                  Score: {row.scorePercent != null ? `${row.scorePercent}%` : "—"}
                </div>
                <div className="lg:col-span-4 flex gap-2">
                  <input
                    className="flex-1 rounded border px-2 py-1 text-sm"
                    placeholder="Check-in comment"
                    value={comments[row.achievement?.id || ""] || ""}
                    onChange={(e) =>
                      setComments((p) => ({
                        ...p,
                        [row.achievement?.id || ""]: e.target.value,
                      }))
                    }
                    disabled={!row.achievement}
                  />
                  <Button
                    size="sm"
                    disabled={!row.achievement || busy === row.achievement?.id}
                    onClick={() => row.achievement && addCheckin(row.achievement.id)}
                  >
                    {row.hasCheckin ? "Update" : "Save"}
                  </Button>
                </div>
                <div className="lg:col-span-2 text-xs">
                  {row.hasCheckin ? (
                    <span className="text-green-600 font-medium">Check-in done</span>
                  ) : (
                    <span className="text-amber-600">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
