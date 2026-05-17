"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";

type Escalation = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  resolvedAt: string | null;
  targetUser: { name: string; email: string; role: string };
};

export default function AdminEscalationsPage() {
  const [items, setItems] = useState<Escalation[]>([]);

  const load = () =>
    api<{ escalations: Escalation[] }>("/api/admin/escalations").then((r) =>
      setItems(r.escalations)
    );

  useEffect(() => {
    load();
  }, []);

  const resolve = async (id: string) => {
    await api("/api/admin/escalations", {
      method: "PATCH",
      body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Escalation log</h1>
      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((e) => (
              <tr key={e.id} className={e.resolvedAt ? "opacity-60" : ""}>
                <td className="px-4 py-3">
                  {e.targetUser.name}
                  <div className="text-xs text-slate-500">{e.targetUser.email}</div>
                </td>
                <td className="px-4 py-3">{e.type}</td>
                <td className="px-4 py-3">{e.message}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(e.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {!e.resolvedAt && (
                    <Button size="sm" variant="outline" onClick={() => resolve(e.id)}>
                      Resolve
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="p-8 text-center text-slate-500">No escalations recorded.</p>
        )}
      </div>
    </div>
  );
}
