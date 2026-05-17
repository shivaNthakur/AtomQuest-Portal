"use client";

type Row = {
  employee: { name: string; department: string | null };
  lockedGoals: number;
  achievementsLogged: number;
  managerCheckins: number;
  employeeComplete: boolean;
  managerComplete: boolean;
};

export function CompletionTable({
  rows,
  summary,
}: {
  rows: Row[];
  summary: {
    totalEmployees: number;
    employeesCompleted: number;
    managersCompleted: number;
  };
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Employees" value={`${summary.employeesCompleted}/${summary.totalEmployees}`} />
        <Stat label="Managers done" value={String(summary.managersCompleted)} />
        <Stat label="Total tracked" value={String(summary.totalEmployees)} />
      </div>
      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Dept</th>
              <th className="px-4 py-3">Goals</th>
              <th className="px-4 py-3">Achievements</th>
              <th className="px-4 py-3">Check-ins</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{r.employee.name}</td>
                <td className="px-4 py-3 text-slate-500">{r.employee.department}</td>
                <td className="px-4 py-3">{r.lockedGoals}</td>
                <td className="px-4 py-3">
                  {r.achievementsLogged}/{r.lockedGoals}
                </td>
                <td className="px-4 py-3">{r.managerCheckins}</td>
                <td className="px-4 py-3">
                  <Badge ok={r.employeeComplete} label="Employee" />
                  <Badge ok={r.managerComplete} label="Manager" className="ml-1" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Badge({ ok, label, className = "" }: { ok: boolean; label: string; className?: string }) {
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full ${className} ${
        ok ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
      }`}
    >
      {label}
    </span>
  );
}
