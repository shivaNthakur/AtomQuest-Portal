"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORS = ["#6366f1", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

type Analytics = {
  qoqTrends: { phase: string; year: number; avgScore: number }[];
  goalDistribution: {
    byThrust: { name: string; value: number }[];
    byUom: { name: string; value: number }[];
    byStatus: { name: string; value: number }[];
  };
  departmentCompletion: { department: string; completionRate: number; goals: number }[];
  managerEffectiveness: {
    managerName: string;
    checkinRate: number;
    teamSize: number;
  }[];
};

export function AnalyticsDashboard({ data }: { data: Analytics }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Quarter-on-quarter achievement">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.qoqTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="phase" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgScore" name="Avg score %" stroke="#6366f1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Goals by thrust area">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data.goalDistribution.byThrust} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {data.goalDistribution.byThrust.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Department completion rates">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.departmentCompletion}>
            <XAxis dataKey="department" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="completionRate" fill="#22c55e" name="Completion %" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Manager check-in effectiveness">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.managerEffectiveness} layout="vertical">
            <XAxis type="number" domain={[0, 100]} />
            <YAxis type="category" dataKey="managerName" width={100} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="checkinRate" fill="#0ea5e9" name="Check-in %" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">{title}</h3>
      {children}
    </div>
  );
}
