"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";
import { useRealTimeSync } from "@/hooks/useRealTimeSync";
import { useAuth } from "@/hooks/useAuth";

const COLUMNS = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
const LABELS: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  DONE: "Done",
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  assignee: { id: string; name: string } | null;
};

export function TaskBoard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    const r = await api<{ tasks: Task[] }>("/api/tasks");
    setTasks(r.tasks);
  }, []);

  useEffect(() => {
    load();
    if (user?.role !== "EMPLOYEE") {
      api<{ users: { id: string; name: string }[] }>("/api/admin/users/list").then((r) =>
        setTeamMembers(r.users)
      );
    }
  }, [load, user?.role]);

  useRealTimeSync({
    task_moved: () => load(),
    task_created: () => load(),
  });

  const move = async (id: string, status: string) => {
    await api(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    load();
  };

  const create = async () => {
    if (!title.trim()) return;
    await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title, assigneeId: assigneeId || undefined }),
    });
    setTitle("");
    load();
  };

  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      {isManager && (
        <div className="rounded-xl border bg-white p-4 flex flex-wrap gap-3 items-end shadow-sm">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-slate-500">New task</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Assign to</label>
            <select
              className="mt-1 block rounded-lg border px-3 py-2 text-sm"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={create}>Add task</Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col} className="rounded-xl bg-slate-100/80 p-3 min-h-[280px]">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
              {LABELS[col]}
            </h3>
            <div className="space-y-2">
              {tasks
                .filter((t) => t.status === col)
                .map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg bg-white border border-slate-200 p-3 shadow-sm text-sm"
                  >
                    <p className="font-medium text-slate-900">{t.title}</p>
                    {t.assignee && (
                      <p className="text-xs text-slate-500 mt-1">{t.assignee.name}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {COLUMNS.filter((s) => s !== t.status).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => move(t.id, s)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-brand-50 text-slate-600"
                        >
                          → {LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
