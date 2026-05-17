"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/fetcher";

type Log = {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  changedAt: string;
  goal: { title: string };
  changedBy: { name: string; email: string };
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    api<{ logs: Log[] }>("/api/reports/audit").then((r) => setLogs(r.logs));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit trail</h1>
      <p className="text-slate-500 text-sm">
        All changes to goals after lock — who changed what and when.
      </p>
      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Goal</th>
              <th className="px-4 py-3">Field</th>
              <th className="px-4 py-3">Change</th>
              <th className="px-4 py-3">By</th>
              <th className="px-4 py-3">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {new Date(l.changedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-medium">{l.goal.title}</td>
                <td className="px-4 py-3">{l.field}</td>
                <td className="px-4 py-3 text-slate-600">
                  {l.oldValue} → {l.newValue}
                </td>
                <td className="px-4 py-3">{l.changedBy.name}</td>
                <td className="px-4 py-3 text-slate-500">{l.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <p className="p-8 text-center text-slate-500">No audit entries yet.</p>
        )}
      </div>
    </div>
  );
}
