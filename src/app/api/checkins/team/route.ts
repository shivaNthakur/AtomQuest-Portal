import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/scoring";
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
      select: { id: true, name: true, email: true, department: true },
    });

    const result = await Promise.all(
      employees.map(async (emp) => {
        const goals = await prisma.goal.findMany({
          where: { employeeId: emp.id, status: "LOCKED" },
          include: {
            thrustArea: true,
            achievements: {
              where: { cycleId },
              include: { checkins: true },
            },
          },
        });

        const rows = goals.map((g) => {
          const ach = g.achievements[0];
          const score = ach
            ? computeScore({
                uomType: g.uomType,
                target: g.target,
                actual: ach.actualValue,
                targetDate: g.targetDate,
                actualDate: ach.actualDate,
              })
            : null;

          return {
            goal: g,
            achievement: ach,
            scorePercent: score?.scorePercent ?? null,
            hasCheckin: (ach?.checkins?.length ?? 0) > 0,
          };
        });

        const completed = rows.filter((r) => r.achievement).length;
        return {
          employee: emp,
          rows,
          completionRate:
            goals.length > 0
              ? Math.round((completed / goals.length) * 100)
              : 0,
        };
      })
    );

    return jsonResponse({ team: result, cycleId });
  } catch (err) {
    return handleApiError(err);
  }
}
