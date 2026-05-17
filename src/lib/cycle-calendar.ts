import type { CheckinPhase } from "@prisma/client";

export const PHASE_WINDOWS: Record<
  CheckinPhase,
  { label: string; openMonth: number; closeMonth: number }
> = {
  GOAL_SETTING: { label: "Goal Setting (May)", openMonth: 5, closeMonth: 5 },
  Q1: { label: "Q1 Check-in (July)", openMonth: 7, closeMonth: 7 },
  Q2: { label: "Q2 Check-in (October)", openMonth: 10, closeMonth: 10 },
  Q3: { label: "Q3 Check-in (January)", openMonth: 1, closeMonth: 1 },
  Q4_ANNUAL: { label: "Q4 / Annual (Mar–Apr)", openMonth: 3, closeMonth: 4 },
};

/** Last day of month (1-based month). */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** BRD calendar: May goal-setting, Jul Q1, Oct Q2, Jan Q3, Mar–Apr Q4/annual. */
export function getAutomaticWindowDates(year: number, phase: CheckinPhase) {
  const cfg = PHASE_WINDOWS[phase];
  const openMonth = cfg.openMonth;
  const closeMonth = cfg.closeMonth;
  const opensAt = new Date(year, openMonth - 1, 1, 0, 0, 0, 0);
  const closesAt = new Date(
    year,
    closeMonth - 1,
    lastDayOfMonth(year, closeMonth),
    23,
    59,
    59,
    999
  );
  return { opensAt, closesAt };
}

export function isWithinAutomaticPhaseWindow(
  phase: CheckinPhase,
  date = new Date(),
  cycleYear?: number
): boolean {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (cycleYear !== undefined && cycleYear !== year) return false;

  const cfg = PHASE_WINDOWS[phase];
  if (phase === "Q4_ANNUAL") {
    return month >= cfg.openMonth && month <= cfg.closeMonth;
  }
  return month >= cfg.openMonth && month <= cfg.closeMonth;
}

export function formatPhaseWindowHint(phase: CheckinPhase, year: number): string {
  const cfg = PHASE_WINDOWS[phase];
  if (phase === "Q4_ANNUAL") {
    return `${cfg.label}: March–April ${year}`;
  }
  const monthNames = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const m = monthNames[cfg.openMonth];
  return `${cfg.label}: ${m} ${year}`;
}
