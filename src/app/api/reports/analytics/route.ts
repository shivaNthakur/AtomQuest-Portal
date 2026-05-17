import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeScore, computeOverallScore } from "@/lib/scoring";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role === "EMPLOYEE") return errorResponse("Forbidden", 403);

    const cycles = await prisma.goalCycle.findMany({
      where: { phase: { in: ["Q1", "Q2", "Q3", "Q4_ANNUAL"] } },
      orderBy: [{ year: "asc" }, { phase: "asc" }],
    });

    const goals = await prisma.goal.findMany({
      where: { status: "LOCKED" },
      include: {
        thrustArea: true,
        employee: { select: { id: true, name: true, department: true, managerId: true } },
        achievements: true,
      },
    });

    const qoqTrends = cycles.map((cycle) => {
      let totalScore = 0;
      let count = 0;

      for (const g of goals) {
        const ach = g.achievements.find((a) => a.cycleId === cycle.id);
        if (!ach) continue;
        const { scorePercent } = computeScore({
          uomType: g.uomType,
          target: g.target,
          actual: ach.actualValue,
          targetDate: g.targetDate,
          actualDate: ach.actualDate,
        });
        totalScore += scorePercent;
        count++;
      }

      return {
        cycleId: cycle.id,
        phase: cycle.phase,
        year: cycle.year,
        avgScore: count > 0 ? Math.round(totalScore / count) : 0,
        entriesCount: count,
      };
    });

    const byThrust: Record<string, number> = {};
    const byUom: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const g of goals) {
      byThrust[g.thrustArea.name] = (byThrust[g.thrustArea.name] || 0) + 1;
      byUom[g.uomType] = (byUom[g.uomType] || 0) + 1;
      const latest = g.achievements.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      )[0];
      const st = latest?.status || "NOT_STARTED";
      byStatus[st] = (byStatus[st] || 0) + 1;
    }

    const deptMap: Record<string, { total: number; completed: number }> = {};
    for (const g of goals) {
      const dept = g.employee.department || "Unassigned";
      if (!deptMap[dept]) deptMap[dept] = { total: 0, completed: 0 };
      deptMap[dept].total++;
      if (g.achievements.some((a) => a.status === "COMPLETED")) {
        deptMap[dept].completed++;
      }
    }

    const managers = await prisma.user.findMany({
      where: { role: "MANAGER" },
      include: { reports: { where: { role: "EMPLOYEE" } } },
    });

    const managerEffectiveness = await Promise.all(
      managers.map(async (mgr) => {
        const reportIds = mgr.reports.map((r) => r.id);
        const teamGoals = goals.filter((g) =>
          reportIds.includes(g.employeeId)
        );
        const withCheckin = await prisma.managerCheckin.count({
          where: { managerId: mgr.id },
        });
        const teamAchievements = teamGoals.reduce(
          (s, g) => s + g.achievements.length,
          0
        );

        return {
          managerId: mgr.id,
          managerName: mgr.name,
          teamSize: mgr.reports.length,
          checkinsGiven: withCheckin,
          teamAchievements,
          checkinRate:
            teamAchievements > 0
              ? Math.round((withCheckin / teamAchievements) * 100)
              : 0,
        };
      })
    );

    return jsonResponse({
      qoqTrends,
      goalDistribution: {
        byThrust: Object.entries(byThrust).map(([name, value]) => ({
          name,
          value,
        })),
        byUom: Object.entries(byUom).map(([name, value]) => ({
          name,
          value,
        })),
        byStatus: Object.entries(byStatus).map(([name, value]) => ({
          name,
          value,
        })),
      },
      departmentCompletion: Object.entries(deptMap).map(([dept, v]) => ({
        department: dept,
        completionRate:
          v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
        goals: v.total,
      })),
      managerEffectiveness,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
