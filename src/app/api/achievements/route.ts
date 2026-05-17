import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/scoring";
import { assertCycleWindow } from "@/lib/cycles";
import { syncSharedAchievements } from "@/lib/shared-goals";
import {
  emitToUser,
  emitToTeam,
} from "@/lib/socket-events";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    const body = await request.json();
    const { goalId, cycleId, actualValue, actualDate, status, notes } = body;

    const windowCheck = await assertCycleWindow(cycleId);
    if (!windowCheck.ok) return errorResponse(windowCheck.error!);

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return errorResponse("Goal not found", 404);
    if (goal.employeeId !== user.id) return errorResponse("Forbidden", 403);
    if (goal.status !== "LOCKED") {
      return errorResponse("Achievements can only be logged for locked goals");
    }

    const { scorePercent } = computeScore({
      uomType: goal.uomType,
      target: goal.target,
      actual: parseFloat(actualValue),
      targetDate: goal.targetDate,
      actualDate: actualDate ? new Date(actualDate) : null,
    });

    const achievement = await prisma.achievement.upsert({
      where: { goalId_cycleId: { goalId, cycleId } },
      create: {
        goalId,
        cycleId,
        actualValue: parseFloat(actualValue),
        actualDate: actualDate ? new Date(actualDate) : null,
        status: status || "ON_TRACK",
        computedScore: scorePercent / 100,
        notes,
      },
      update: {
        actualValue: parseFloat(actualValue),
        actualDate: actualDate ? new Date(actualDate) : null,
        status: status || "ON_TRACK",
        computedScore: scorePercent / 100,
        notes,
      },
      include: { goal: { include: { thrustArea: true } } },
    });

    await syncSharedAchievements(goalId, cycleId, {
      actualValue: parseFloat(actualValue),
      actualDate: actualDate ? new Date(actualDate) : null,
      status: status || "ON_TRACK",
      computedScore: scorePercent / 100,
      notes,
    });

    if (user.managerId) {
      emitToTeam(user.managerId, "achievement_logged", {
        goalId,
        employeeId: user.id,
        cycleId,
      });
    }
    emitToUser(user.id, "achievement_logged", { goalId, cycleId });

    return jsonResponse({ ...achievement, scorePercent });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");

    const achievements = await prisma.achievement.findMany({
      where: {
        goal: { employeeId: user.id },
        ...(cycleId ? { cycleId } : {}),
      },
      include: {
        goal: { include: { thrustArea: true } },
        cycle: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const mapped = achievements.map((a) => ({
      ...a,
      goalId: a.goalId,
    }));

    return jsonResponse({ achievements: mapped });
  } catch (err) {
    return handleApiError(err);
  }
}
