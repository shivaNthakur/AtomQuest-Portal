"use client";

import { TaskBoard } from "@/components/tasks/TaskBoard";

export default function TasksPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Team tasks</h1>
        <p className="text-slate-500 text-sm">Kanban board — moves sync live for your team</p>
      </div>
      <TaskBoard />
    </div>
  );
}
