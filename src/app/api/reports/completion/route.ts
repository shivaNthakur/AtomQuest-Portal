import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role === "EMPLOYEE") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");
    if (!cycleId) return errorResponse("cycleId is required");

    const employeeFilter =
      user.role === "ADMIN" ? {} : { managerId: user.id };

    const employees = await prisma.user.findMany({
      where: { ...employeeFilter, role: "EMPLOYEE" },
      include: { manager: { select: { id: true, name: true } } },
    });

    const rows = await Promise.all(
      employees.map(async (emp) => {
        const lockedCount = await prisma.goal.count({
          where: { employeeId: emp.id, status: "LOCKED" },
        });
        const achievementCount = await prisma.achievement.count({
          where: {
            cycleId,
            goal: { employeeId: emp.id, status: "LOCKED" },
          },
        });
        const checkinCount = await prisma.managerCheckin.count({
          where: {
            cycleId,
            achievement: { goal: { employeeId: emp.id } },
          },
        });

        return {
          employee: {
            id: emp.id,
            name: emp.name,
            department: emp.department,
            manager: emp.manager,
          },
          lockedGoals: lockedCount,
          achievementsLogged: achievementCount,
          managerCheckins: checkinCount,
          employeeComplete:
            lockedCount > 0 && achievementCount >= lockedCount,
          managerComplete:
            achievementCount > 0 && checkinCount >= achievementCount,
        };
      })
    );

    const summary = {
      totalEmployees: rows.length,
      employeesCompleted: rows.filter((r) => r.employeeComplete).length,
      managersCompleted: rows.filter((r) => r.managerComplete).length,
    };

    return jsonResponse({ rows, summary, cycleId });
  } catch (err) {
    return handleApiError(err);
  }
}
