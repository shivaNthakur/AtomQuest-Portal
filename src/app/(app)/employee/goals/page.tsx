"use client";

import { useCallback, useEffect, useState } from "react";
import { GoalForm, type GoalFormData } from "@/components/goals/GoalForm";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";
import { useRealTimeSync } from "@/hooks/useRealTimeSync";
import { STATUS_LABELS } from "@/lib/utils";

type Cycle = { id: string; phase: string; year: number; isActive: boolean };
type Goal = {
  id: string;
  title: string;
  weightage: number;
  target: number;
  status: string;
  returnReason?: string | null;
  thrustArea: { name: string };
  isShared: boolean;
};

export default function EmployeeGoalsPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cycleId, setCycleId] = useState("");
  const [thrustAreas, setThrustAreas] = useState<{ id: string; name: string }[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState("");
  const [weightEdits, setWeightEdits] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [c, t] = await Promise.all([
      api<{ cycles: Cycle[] }>("/api/cycles"),
      api<{ thrustAreas: { id: string; name: string }[] }>("/api/thrust-areas"),
    ]);
    setCycles(c.cycles);
    setThrustAreas(t.thrustAreas);
    const active = c.cycles.find((x) => x.phase === "GOAL_SETTING" && x.isActive) || c.cycles[0];
    const cid = cycleId || active?.id || "";
    if (!cycleId && cid) setCycleId(cid);
    if (cid) {
      const g = await api<{ goals: Goal[]; totalWeight: number }>(`/api/goals?cycleId=${cid}`);
      setGoals(g.goals);
      setTotalWeight(g.totalWeight);
    }
  }, [cycleId]);

  useEffect(() => {
    load();
  }, [load]);

  useRealTimeSync({ goal_approved: () => load(), goal_returned: () => load() });

  const createGoal = async (data: GoalFormData) => {
    await api("/api/goals", {
      method: "POST",
      body: JSON.stringify({ ...data, cycleId }),
    });
    setShowForm(false);
    load();
  };

  const submitAll = async () => {
    try {
      const res = await api<{ message: string }>("/api/goals/submit", {
        method: "POST",
        body: JSON.stringify({ cycleId }),
      });
      setMsg(res.message);
      load();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const canEdit = goals.some((g) => ["DRAFT", "RETURNED"].includes(g.status));
  const draftCount = goals.filter((g) => ["DRAFT", "RETURNED"].includes(g.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My goals</h1>
          <p className="text-slate-500 text-sm">Create and submit your goal sheet for the cycle</p>
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

      {msg && <div className="rounded-lg bg-brand-50 text-brand-800 text-sm p-3">{msg}</div>}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-3">Goal</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {goals.map((g) => (
              <tr key={g.id}>
                <td className="px-4 py-3">
                  {g.title}
                  {g.isShared && (
                    <span className="ml-2 text-xs bg-slate-100 px-1 rounded">Shared</span>
                  )}
                  {g.returnReason && (
                    <p className="text-xs text-amber-600 mt-1">{g.returnReason}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{g.thrustArea.name}</td>
                <td className="px-4 py-3">{g.target}</td>
                <td className="px-4 py-3">
                  {g.isShared && g.status === "LOCKED" ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={10}
                        className="w-16 rounded border px-1 py-0.5 text-xs"
                        value={weightEdits[g.id] ?? String(g.weightage)}
                        onChange={(e) =>
                          setWeightEdits((p) => ({ ...p, [g.id]: e.target.value }))
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={async () => {
                          await api(`/api/goals/${g.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({
                              weightage: parseFloat(weightEdits[g.id] || String(g.weightage)),
                            }),
                          });
                          setMsg("Weightage updated");
                          load();
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    `${g.weightage}%`
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100">
                    {STATUS_LABELS[g.status] || g.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {goals.length === 0 && (
          <p className="p-8 text-center text-slate-500">No goals yet. Add your first goal below.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Hide form" : "Add goal"}
        </Button>
        {canEdit && draftCount > 0 && (
          <Button variant="secondary" onClick={submitAll}>
            Submit for approval ({totalWeight}%)
          </Button>
        )}
      </div>

      {showForm && (
        <GoalForm
          thrustAreas={thrustAreas}
          totalUsed={totalWeight}
          existingCount={goals.filter((g) => g.status !== "RETURNED").length}
          onSubmit={createGoal}
        />
      )}
    </div>
  );
}
