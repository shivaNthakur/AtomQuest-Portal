"use client";

import { FeedbackPanel } from "@/components/feedback/FeedbackPanel";

export default function FeedbackPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Feedback</h1>
        <p className="text-slate-500 text-sm">Peer, upward, and downward feedback</p>
      </div>
      <FeedbackPanel />
    </div>
  );
}
