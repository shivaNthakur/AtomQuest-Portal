"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "EMPLOYEE") router.replace("/employee/goals");
    else if (user.role === "MANAGER") router.replace("/manager/approvals");
    else router.replace("/admin/dashboard");
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      Redirecting…
    </div>
  );
}
