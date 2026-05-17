import { prisma } from "./prisma";

/** Sync achievement from primary owner to all linked recipient goals */
export async function syncSharedAchievements(
  goalId: string,
  cycleId: string,
  data: {
    actualValue: number;
    actualDate?: Date | null;
    status: string;
    computedScore: number;
    notes?: string;
  }
) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { sharedLinks: true },
  });
  if (!goal) return;

  const linkAsRecipient = await prisma.sharedGoalLink.findFirst({
    where: { masterGoalId: goalId },
  });
  const linkAsMember = await prisma.sharedGoalLink.findFirst({
    where: { recipientId: goal.employeeId },
    include: { masterGoal: true },
  });

  const masterGoalId = linkAsRecipient ? goalId : linkAsMember?.masterGoalId;
  if (!masterGoalId) return;

  const master = await prisma.goal.findUnique({ where: { id: masterGoalId } });
  if (!master?.primaryOwnerId) return;

  if (goal.employeeId !== master.primaryOwnerId) return;

  const links = await prisma.sharedGoalLink.findMany({
    where: { masterGoalId },
  });

  const recipientGoals = await prisma.goal.findMany({
    where: {
      employeeId: { in: links.map((l) => l.recipientId) },
      cycleId: goal.cycleId,
      title: master.title,
      isShared: true,
    },
  });

  for (const lg of recipientGoals) {
    if (lg.id === goalId) continue;
    await prisma.achievement.upsert({
      where: { goalId_cycleId: { goalId: lg.id, cycleId } },
      create: {
        goalId: lg.id,
        cycleId,
        actualValue: data.actualValue,
        actualDate: data.actualDate,
        status: data.status as never,
        computedScore: data.computedScore,
        notes: data.notes,
      },
      update: {
        actualValue: data.actualValue,
        actualDate: data.actualDate,
        status: data.status as never,
        computedScore: data.computedScore,
        notes: data.notes,
      },
    });
  }
}
