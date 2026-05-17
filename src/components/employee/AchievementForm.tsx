"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";

type Goal = {
  id: string;
  title: string;
  target: number;
  uomType: string;
  targetDate?: string | null;
  thrustArea: { name: string };
  achievements?: { actualValue: number; status: string; computedScore?: number | null }[];
};

export function AchievementForm({
  goals,
  cycleId,
  onSaved,
}: {
  goals: Goal[];
  cycleId: string;
  onSaved: () => void;
}) {
  const locked = goals.filter((g) => g);
  const [busy, setBusy] = useState<string | null>(null);

  const save = async (
    goalId: string,
    data: { actualValue: number; actualDate?: string; status: string; notes?: string }
  ) => {
    setBusy(goalId);
    try {
      await api("/api/achievements", {
        method: "POST",
        body: JSON.stringify({ goalId, cycleId, ...data }),
      });
      onSaved();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {locked.map((g) => (
        <GoalAchievementRow
          key={g.id}
          goal={g}
          busy={busy === g.id}
          onSave={save}
        />
      ))}
    </div>
  );
}

function GoalAchievementRow({
  goal,
  busy,
  onSave,
}: {
  goal: Goal;
  busy: boolean;
  onSave: (
    id: string,
    d: { actualValue: number; actualDate?: string; status: string; notes?: string }
  ) => void;
}) {
  const existing = goal.achievements?.[0];
  const [actual, setActual] = useState(String(existing?.actualValue ?? ""));
  const [status, setStatus] = useState(existing?.status || "ON_TRACK");
  const [actualDate, setActualDate] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex justify-between gap-4 mb-3">
        <div>
          <h3 className="font-medium text-slate-900">{goal.title}</h3>
          <p className="text-xs text-slate-500">
            Target: {goal.target} · {goal.thrustArea.name}
          </p>
        </div>
        {existing?.computedScore != null && (
          <span className="text-sm font-semibold text-brand-600">
            {Math.round((existing.computedScore || 0) * 100)}%
          </span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="text-xs text-slate-500">Actual</label>
          <input
            type="number"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        {goal.uomType === "TIMELINE" && (
          <div>
            <label className="text-xs text-slate-500">Completion date</label>
            <input
              type="date"
              value={actualDate}
              onChange={(e) => setActualDate(e.target.value)}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
            />
          </div>
        )}
        <div>
          <label className="text-xs text-slate-500">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
          >
            <option value="NOT_STARTED">Not Started</option>
            <option value="ON_TRACK">On Track</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button
            size="sm"
            className="w-full"
            disabled={busy}
            onClick={() =>
              onSave(goal.id, {
                actualValue: parseFloat(actual) || 0,
                actualDate: actualDate || undefined,
                status,
                notes,
              })
            }
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
