"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";
import { UOM_LABELS } from "@/lib/utils";

export default function SharedGoalsPage() {
  const [thrustAreas, setThrustAreas] = useState<{ id: string; name: string }[]>([]);
  const [cycles, setCycles] = useState<{ id: string; phase: string; year: number }[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    cycleId: "",
    thrustAreaId: "",
    title: "",
    description: "",
    uomType: "NUMERIC_MIN",
    target: "",
    targetDate: "",
    primaryOwnerId: "",
  });

  useEffect(() => {
    Promise.all([
      api<{ thrustAreas: { id: string; name: string }[] }>("/api/thrust-areas"),
      api<{ cycles: { id: string; phase: string; year: number; isActive: boolean }[] }>(
        "/api/cycles"
      ),
      api<{ users: { id: string; name: string }[] }>("/api/admin/users/list"),
    ]).then(([t, c, u]) => {
      setThrustAreas(t.thrustAreas);
      const gs = c.cycles.find((x) => x.phase === "GOAL_SETTING" && x.isActive);
      setCycles(c.cycles);
      setForm((f) => ({
        ...f,
        cycleId: gs?.id || c.cycles[0]?.id || "",
      }));
      setEmployees(u.users);
    });
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const push = async () => {
    if (selected.length === 0) return alert("Select at least one employee");
    await api("/api/goals/shared", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        target: parseFloat(form.target) || 0,
        recipientIds: selected,
        primaryOwnerId: form.primaryOwnerId || selected[0],
      }),
    });
    setMsg(`Shared KPI pushed to ${selected.length} employee(s)`);
    setSelected([]);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Push shared KPI</h1>
        <p className="text-slate-500 text-sm">
          Recipients get a locked goal; they may adjust weightage only. Primary owner
          syncs achievements.
        </p>
      </div>
      {msg && <div className="rounded-lg bg-brand-50 text-brand-800 text-sm p-3">{msg}</div>}

      <div className="rounded-xl border bg-white p-6 space-y-4 shadow-sm">
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={form.cycleId}
          onChange={(e) => setForm({ ...form, cycleId: e.target.value })}
        >
          {cycles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.year} — {c.phase}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={form.thrustAreaId}
          onChange={(e) => setForm({ ...form, thrustAreaId: e.target.value })}
        >
          <option value="">Thrust area</option>
          {thrustAreas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Goal title (read-only for recipients)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={form.uomType}
          onChange={(e) => setForm({ ...form, uomType: e.target.value })}
        >
          {Object.keys(UOM_LABELS).map((k) => (
            <option key={k} value={k}>
              {UOM_LABELS[k].label}
            </option>
          ))}
        </select>
        <input
          type="number"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Target (read-only for recipients)"
          value={form.target}
          onChange={(e) => setForm({ ...form, target: e.target.value })}
        />
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={form.primaryOwnerId}
          onChange={(e) => setForm({ ...form, primaryOwnerId: e.target.value })}
        >
          <option value="">Primary owner (achievement sync)</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <div>
          <p className="text-sm font-medium mb-2">Recipients</p>
          <div className="flex flex-wrap gap-2">
            {employees.map((e) => (
              <label
                key={e.id}
                className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer ${
                  selected.includes(e.id)
                    ? "bg-brand-50 border-brand-500 text-brand-700"
                    : "bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selected.includes(e.id)}
                  onChange={() => toggle(e.id)}
                />
                {e.name}
              </label>
            ))}
          </div>
        </div>
        <Button onClick={push} disabled={!form.title || !form.thrustAreaId}>
          Push to team
        </Button>
      </div>
    </div>
  );
}
