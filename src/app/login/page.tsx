"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/RoleBadge";
import {
  Sparkles,
  Target,
  Users,
  Shield,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";

const DEMO = [
  {
    role: "EMPLOYEE" as const,
    label: "Employee",
    email: "priya.sharma@atomberg.com",
    password: "demo1234",
    icon: Target,
    gradient:
      "from-emerald-500/20 to-teal-600/10 border-emerald-300/50 hover:border-emerald-400",
  },
  {
    role: "MANAGER" as const,
    label: "Manager",
    email: "vikram.singh@atomberg.com",
    password: "demo1234",
    icon: Users,
    gradient: "from-sky-500/20 to-blue-600/10 border-sky-300/50 hover:border-sky-400",
  },
  {
    role: "ADMIN" as const,
    label: "Admin / HR",
    email: "hr.admin@atomberg.com",
    password: "demo1234",
    icon: Shield,
    gradient:
      "from-amber-500/20 to-orange-600/10 border-amber-300/50 hover:border-amber-400",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [signedInRole, setSignedInRole] = useState<string | null>(null);

  const navigateByRole = (role: string) => {
    if (role === "EMPLOYEE") router.push("/employee/goals");
    else if (role === "MANAGER") router.push("/manager/approvals");
    else router.push("/admin/dashboard");
  };

  const go = async (em: string, pw: string, label?: string) => {
    setLoading(label || "custom");
    setError("");
    setSignedInRole(null);
    try {
      const role = await login(em, pw);
      setSignedInRole(role);
      setTimeout(() => navigateByRole(role), 400);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-600 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-teal-500/30">
              A
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AtomQuest</h1>
              <p className="text-teal-200/80 text-sm">Atomberg · Goals & Work OS</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold leading-tight max-w-md">
            Goal setting, check-ins & team collaboration — in one portal.
          </h2>
          <p className="mt-4 text-slate-300 max-w-md text-lg leading-relaxed">
            Built for Atomberg&apos;s performance culture: OKRs, quarterly achievements,
            manager approvals, chat, Kanban tasks, and 360° feedback.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-sm text-teal-200/70">
          <Sparkles className="w-4 h-4" />
          Demo data pre-loaded · password{" "}
          <code className="text-teal-100 bg-white/10 px-1.5 py-0.5 rounded">demo1234</code>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold">
              A
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AtomQuest</h1>
              <p className="text-sm text-slate-500">Atomberg Portal</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
            <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              One-click demo access or sign in with your Atomberg email.
            </p>

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Quick demo — sign in as
            </p>
            <div className="space-y-2 mb-6">
              {DEMO.map((d) => {
                const Icon = d.icon;
                return (
                  <button
                    key={d.role}
                    type="button"
                    disabled={!!loading}
                    onClick={() => go(d.email, d.password, d.label)}
                    className={`w-full text-left rounded-xl border bg-gradient-to-r p-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-md disabled:opacity-60 ${d.gradient}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center text-slate-700">
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-2 flex-wrap">
                            {loading === d.label ? "Signing in…" : d.label}
                            <RoleBadge role={d.role} />
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{d.email}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400">or email & password</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 text-red-700 text-sm p-3 border border-red-100">
                {error}
              </div>
            )}

            {signedInRole && (
              <div className="mb-4 rounded-xl bg-teal-50 border border-teal-100 p-3 flex items-center justify-between gap-2">
                <span className="text-sm text-teal-900 font-medium">Signed in as</span>
                <RoleBadge role={signedInRole} />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@atomberg.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition"
                  onKeyDown={(e) =>
                    e.key === "Enter" && email && password && go(email, password)
                  }
                />
              </div>
              <Button
                className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md shadow-teal-500/20"
                disabled={!email || !password || !!loading}
                onClick={() => go(email, password)}
              >
                {loading === "custom" ? "Signing in…" : "Sign in"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
