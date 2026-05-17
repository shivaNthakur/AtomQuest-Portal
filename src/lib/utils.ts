import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const UOM_LABELS: Record<
  string,
  { label: string; hint: string; formula: string }
> = {
  NUMERIC_MIN: {
    label: "Numeric — Min (higher is better)",
    hint: "e.g. Sales Revenue",
    formula: "Achievement ÷ Target",
  },
  NUMERIC_MAX: {
    label: "Numeric — Max (lower is better)",
    hint: "e.g. TAT, Cost",
    formula: "Target ÷ Achievement",
  },
  TIMELINE: {
    label: "Timeline (date-based)",
    hint: "e.g. Project deadline",
    formula: "Completion vs Deadline",
  },
  ZERO_BASED: {
    label: "Zero-based (zero = success)",
    hint: "e.g. Safety incidents",
    formula: "0 → 100%, else 0%",
  },
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  RETURNED: "Returned",
  LOCKED: "Locked",
  NOT_STARTED: "Not Started",
  ON_TRACK: "On Track",
  COMPLETED: "Completed",
};
