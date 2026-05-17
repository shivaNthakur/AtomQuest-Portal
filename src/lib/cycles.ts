import type { CheckinPhase } from "@prisma/client";
import { prisma } from "./prisma";
import {
  formatPhaseWindowHint,
  isWithinAutomaticPhaseWindow,
  PHASE_WINDOWS,
} from "./cycle-calendar";

export { PHASE_WINDOWS };

export async function getActiveCycle(phase?: CheckinPhase) {
  if (phase) {
    return prisma.goalCycle.findFirst({
      where: { phase, isActive: true },
      orderBy: { year: "desc" },
    });
  }
  return prisma.goalCycle.findFirst({
    where: { isActive: true },
    orderBy: { year: "desc" },
  });
}

/** Enforces BRD month windows (May / Jul / Oct / Jan / Mar–Apr) with optional demo override. */
export async function assertCycleWindow(cycleId: string) {
  const cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) return { ok: false, error: "Cycle not found" };

  if (process.env.CYCLE_DEMO_OPEN === "true") {
    return { ok: true, cycle };
  }

  const now = new Date();
  if (isWithinAutomaticPhaseWindow(cycle.phase, now, cycle.year)) {
    return { ok: true, cycle };
  }

  if (now >= cycle.opensAt && now <= cycle.closesAt) {
    return { ok: true, cycle };
  }

  return {
    ok: false,
    error: `This action is only allowed during ${formatPhaseWindowHint(cycle.phase, cycle.year)} (BRD calendar).`,
  };
}
