"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";
import { useRealTimeSync } from "@/hooks/useRealTimeSync";
import { useAuth } from "@/hooks/useAuth";

type FeedbackItem = {
  id: string;
  type: string;
  content: string;
  rating: number | null;
  isAnonymous: boolean;
  createdAt: string;
  provider?: { id: string; name: string };
  recipient?: { id: string; name: string };
};

export function FeedbackPanel() {
  const { user } = useAuth();
  const [inbox, setInbox] = useState<FeedbackItem[]>([]);
  const [sent, setSent] = useState<FeedbackItem[]>([]);
  const [adminSummary, setAdminSummary] = useState<{
    byType: { type: string; _count: { id: number } }[];
    recent: FeedbackItem[];
  } | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    recipientId: "",
    type: "PEER",
    content: "",
    rating: 5,
    isAnonymous: false,
  });

  const load = useCallback(async () => {
    if (user?.role === "ADMIN") {
      const s = await api<{
        byType: { type: string; _count: { id: number } }[];
        recent: FeedbackItem[];
      }>("/api/feedback?view=admin-summary");
      setAdminSummary(s);
    }
    const r = await api<{ inbox: FeedbackItem[]; sent: FeedbackItem[] }>(
      "/api/feedback"
    );
    setInbox(
      r.inbox.map((f) => ({
        ...f,
        provider: f.isAnonymous
          ? { id: "anon", name: "Anonymous" }
          : f.provider,
      }))
    );
    setSent(r.sent);
  }, [user?.role]);

  useEffect(() => {
    load();
    api<{ users: { id: string; name: string }[] }>("/api/admin/users/list").then(
      (r) => setUsers(r.users)
    );
  }, [load]);

  useRealTimeSync({ feedback_received: () => load() });

  const submit = async () => {
    await api("/api/feedback", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setForm({ ...form, content: "", rating: 5 });
    load();
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border bg-white p-6 shadow-sm max-w-xl">
        <h2 className="font-semibold text-slate-900 mb-4">Give feedback</h2>
        <div className="space-y-3">
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.recipientId}
            onChange={(e) => setForm({ ...form, recipientId: e.target.value })}
          >
            <option value="">Select colleague</option>
            {users
              .filter((u) => u.id !== user?.id)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="PEER">Peer</option>
            <option value="UPWARD">Upward (to manager)</option>
            <option value="DOWNWARD">Downward (to report)</option>
            {user?.role === "ADMIN" && (
              <option value="HR_REVIEW">HR review</option>
            )}
          </select>
          <textarea
            className="w-full rounded-lg border px-3 py-2 text-sm min-h-[80px]"
            placeholder="Your feedback…"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isAnonymous}
              onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
            />
            Send anonymously
          </label>
          <Button onClick={submit} disabled={!form.recipientId || !form.content}>
            Submit feedback
          </Button>
        </div>
      </div>

      {user?.role === "ADMIN" && adminSummary && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold mb-4">HR — Feedback volume</h2>
          <div className="flex gap-4 flex-wrap mb-4">
            {adminSummary.byType.map((b) => (
              <div key={b.type} className="rounded-lg bg-slate-50 px-4 py-2 text-sm">
                <span className="font-medium">{b.type}</span>: {b._count.id}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold mb-3">Inbox</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {inbox.map((f) => (
              <div key={f.id} className="border rounded-lg p-3 text-sm">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{f.type}</span>
                  <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-slate-800">{f.content}</p>
                <p className="text-xs text-slate-500 mt-1">
                  From {f.provider?.name}
                  {f.rating ? ` · ${f.rating}/5` : ""}
                </p>
              </div>
            ))}
            {inbox.length === 0 && (
              <p className="text-slate-500 text-sm">No feedback yet.</p>
            )}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold mb-3">Sent</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sent.map((f) => (
              <div key={f.id} className="border rounded-lg p-3 text-sm">
                <p className="text-slate-800">{f.content}</p>
                <p className="text-xs text-slate-500 mt-1">
                  To {f.recipient?.name} · {f.type}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
