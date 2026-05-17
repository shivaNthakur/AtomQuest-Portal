"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { cn } from "@/lib/utils";

const NAV: Record<string, { href: string; label: string }[]> = {
  EMPLOYEE: [
    { href: "/employee/goals", label: "My Goals" },
    { href: "/employee/achievements", label: "Achievements" },
    { href: "/work/tasks", label: "Tasks" },
    { href: "/work/feedback", label: "Feedback" },
  ],
  MANAGER: [
    { href: "/manager/approvals", label: "Approvals" },
    { href: "/manager/shared-goals", label: "Shared KPIs" },
    { href: "/manager/checkins", label: "Check-ins" },
    { href: "/manager/dashboard", label: "Dashboard" },
    { href: "/work/tasks", label: "Tasks" },
    { href: "/work/feedback", label: "Feedback" },
  ],
  ADMIN: [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/cycles", label: "Cycles" },
    { href: "/admin/goals", label: "Unlock goals" },
    { href: "/admin/escalations", label: "Escalations" },
    { href: "/admin/audit", label: "Audit" },
    { href: "/work/feedback", label: "Feedback" },
  ],
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 animate-pulse" />
          <span>Loading AtomQuest…</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const links = NAV[user.role] || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6 overflow-x-auto">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold text-slate-900 shrink-0"
            >
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center text-sm shadow-sm">
                A
              </span>
              AtomQuest
            </Link>
            <nav className="hidden lg:flex gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                    pathname.startsWith(l.href)
                      ? "bg-teal-50 text-teal-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">{user.name}</span>
              <RoleBadge role={user.role} />
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      <ChatDrawer />
    </div>
  );
}
