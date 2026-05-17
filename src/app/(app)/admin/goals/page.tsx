"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";

type Goal = {
  id: string;
  title: string;
  status: string;
  employee: { name: string; email: string };
};

export default function AdminGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const load = () =>
    api<{ goals: Goal[] }>("/api/admin/goals").then((r) => setGoals(r.goals));

  useEffect(() => {
    load();
  }, []);

  const unlock = async (id: string) => {
    const reason = reasons[id];
    if (!reason?.trim()) {
      alert("Reason required to unlock");
      return;
    }
    await api(`/api/goals/${id}/unlock`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    setMsg("Goal unlocked — employee can edit again");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Goal exceptions</h1>
        <p className="text-slate-500 text-sm">Unlock locked goals (audit trail recorded)</p>
      </div>
      {msg && (
        <div className="rounded-lg bg-green-50 text-green-800 text-sm p-3">{msg}</div>
      )}
      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Goal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Unlock reason</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {goals.map((g) => (
              <tr key={g.id}>
                <td className="px-4 py-3">{g.employee.name}</td>
                <td className="px-4 py-3 font-medium">{g.title}</td>
                <td className="px-4 py-3">{g.status}</td>
                <td className="px-4 py-3">
                  <input
                    className="w-full rounded border px-2 py-1 text-xs"
                    placeholder="Reason for unlock"
                    value={reasons[g.id] || ""}
                    onChange={(e) =>
                      setReasons((p) => ({ ...p, [g.id]: e.target.value }))
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => unlock(g.id)}>
                    Unlock
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
