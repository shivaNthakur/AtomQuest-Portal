"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";

export default function AdminCyclesPage() {
  const [cycles, setCycles] = useState<
    { id: string; year: number; phase: string; opensAt: string; closesAt: string; isActive: boolean }[]
  >([]);
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    phase: "GOAL_SETTING",
    opensAt: "",
    closesAt: "",
    isActive: true,
  });

  const load = () =>
    api<{ cycles: typeof cycles }>("/api/admin/cycles").then((r) => setCycles(r.cycles));

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    await api("/api/admin/cycles", {
      method: "POST",
      body: JSON.stringify(form),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Goal cycles</h1>
      <div className="rounded-xl border bg-white p-6 grid gap-4 md:grid-cols-2 max-w-2xl">
        <label className="text-sm">
          Year
          <input
            type="number"
            className="mt-1 w-full rounded border px-2 py-1"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
          />
        </label>
        <label className="text-sm">
          Phase
          <select
            className="mt-1 w-full rounded border px-2 py-1"
            value={form.phase}
            onChange={(e) => setForm({ ...form, phase: e.target.value })}
          >
            {["GOAL_SETTING", "Q1", "Q2", "Q3", "Q4_ANNUAL"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Opens
          <input
            type="date"
            className="mt-1 w-full rounded border px-2 py-1"
            value={form.opensAt}
            onChange={(e) => setForm({ ...form, opensAt: e.target.value })}
          />
        </label>
        <label className="text-sm">
          Closes
          <input
            type="date"
            className="mt-1 w-full rounded border px-2 py-1"
            value={form.closesAt}
            onChange={(e) => setForm({ ...form, closesAt: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active cycle
        </label>
        <Button onClick={save}>Save cycle</Button>
      </div>
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Phase</th>
              <th className="px-4 py-3">Window</th>
              <th className="px-4 py-3">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cycles.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">{c.year}</td>
                <td className="px-4 py-3">{c.phase}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(c.opensAt).toLocaleDateString()} –{" "}
                  {new Date(c.closesAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">{c.isActive ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
