import { prisma } from "./prisma";

export const MAX_GOALS = 8;
export const MIN_WEIGHT = 10;
export const TOTAL_WEIGHT = 100;

export async function validateWeightage(
  employeeId: string,
  cycleId: string,
  newWeight: number,
  excludeGoalId?: string | null
) {
  const goals = await prisma.goal.findMany({
    where: {
      employeeId,
      cycleId,
      id: excludeGoalId ? { not: excludeGoalId } : undefined,
      status: { not: "RETURNED" },
    },
    select: { weightage: true },
  });

  const existingTotal = goals.reduce((s, g) => s + g.weightage, 0);
  const projected = existingTotal + newWeight;

  if (newWeight < MIN_WEIGHT) {
    return {
      valid: false as const,
      error: `Minimum weightage per goal is ${MIN_WEIGHT}%`,
    };
  }
  if (projected > TOTAL_WEIGHT) {
    return {
      valid: false as const,
      error: `Total weightage would be ${projected}% — exceeds ${TOTAL_WEIGHT}%`,
      remaining: TOTAL_WEIGHT - existingTotal,
    };
  }
  return { valid: true as const, remaining: TOTAL_WEIGHT - existingTotal };
}
