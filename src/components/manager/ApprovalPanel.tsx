"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";
type Goal = {
  id: string;
  title: string;
  target: number;
  weightage: number;
  status: string;
  uomType: string;
  thrustArea: { name: string };
  returnReason?: string | null;
};

type TeamMember = {
  employee: { id: string; name: string; department: string | null };
  goals: Goal[];
  totalWeight: number;
};

export function ApprovalPanel({
  team,
  onRefresh,
}: {
  team: TeamMember[];
  onRefresh: () => void;
}) {
  const [edits, setEdits] = useState<Record<string, { target: number; weightage: number }>>({});
  const [returnReason, setReturnReason] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const submitted = team.filter((t) =>
    t.goals.some((g) => g.status === "SUBMITTED")
  );

  const approve = async (goalId: string) => {
    setBusy(goalId);
    try {
      const e = edits[goalId];
      await api(`/api/goals/${goalId}/approve`, {
        method: "POST",
        body: JSON.stringify(e || {}),
      });
      onRefresh();
    } finally {
      setBusy(null);
    }
  };

  const returnGoal = async (goalId: string) => {
    const reason = returnReason[goalId];
    if (!reason?.trim()) return alert("Return reason required");
    setBusy(goalId);
    try {
      await api(`/api/goals/${goalId}/return`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      onRefresh();
    } finally {
      setBusy(null);
    }
  };

  if (submitted.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
        No goals pending approval.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {submitted.map(({ employee, goals }) => (
        <div key={employee.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-slate-900">{employee.name}</h3>
              <p className="text-xs text-slate-500">{employee.department}</p>
            </div>
            <span className="text-sm text-slate-600">
              {goals.filter((g) => g.status === "SUBMITTED").length} pending
            </span>
          </div>
          <div className="divide-y">
            {goals
              .filter((g) => g.status === "SUBMITTED")
              .map((g) => (
                <div key={g.id} className="p-4 grid gap-3 md:grid-cols-12 md:items-end">
                  <div className="md:col-span-5">
                    <p className="font-medium text-slate-900">{g.title}</p>
                    <p className="text-xs text-slate-500">
                      {g.thrustArea.name} · {g.uomType}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-slate-500">Target</label>
                    <input
                      type="number"
                      className="w-full rounded border px-2 py-1 text-sm"
                      value={edits[g.id]?.target ?? g.target}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [g.id]: {
                            target: parseFloat(e.target.value),
                            weightage: prev[g.id]?.weightage ?? g.weightage,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-slate-500">Weight %</label>
                    <input
                      type="number"
                      className="w-full rounded border px-2 py-1 text-sm"
                      value={edits[g.id]?.weightage ?? g.weightage}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [g.id]: {
                            weightage: parseFloat(e.target.value),
                            target: prev[g.id]?.target ?? g.target,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="md:col-span-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busy === g.id}
                      onClick={() => approve(g.id)}
                    >
                      Approve
                    </Button>
                    <input
                      placeholder="Return reason"
                      className="flex-1 min-w-[120px] rounded border px-2 py-1 text-xs"
                      value={returnReason[g.id] || ""}
                      onChange={(e) =>
                        setReturnReason((p) => ({ ...p, [g.id]: e.target.value }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === g.id}
                      onClick={() => returnGoal(g.id)}
                    >
                      Return
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
