import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  EMPLOYEE: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  MANAGER: "bg-sky-100 text-sky-800 ring-sky-200",
  ADMIN: "bg-amber-100 text-amber-900 ring-amber-200",
};

const LABELS: Record<string, string> = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  ADMIN: "Admin / HR",
};

export function RoleBadge({
  role,
  className,
}: {
  role: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        STYLES[role] || "bg-slate-100 text-slate-700 ring-slate-200",
        className
      )}
    >
      {LABELS[role] || role}
    </span>
  );
}
