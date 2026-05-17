import { requireSessionFromRequest, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role === "EMPLOYEE") return errorResponse("Forbidden", 403);

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");
    const status = searchParams.get("status");

    const employeeFilter =
      user.role === "ADMIN" ? {} : { managerId: user.id };

    const employees = await prisma.user.findMany({
      where: { ...employeeFilter, role: "EMPLOYEE" },
      select: { id: true, name: true, email: true, department: true },
    });

    const employeeIds = employees.map((e) => e.id);

    const goals = await prisma.goal.findMany({
      where: {
        employeeId: { in: employeeIds },
        ...(cycleId && { cycleId }),
        ...(status && { status: status as never }),
      },
      include: {
        employee: {
          select: { id: true, name: true, email: true, department: true },
        },
        thrustArea: true,
        achievements: { orderBy: { submittedAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    const byEmployee = employees.map((emp) => ({
      employee: emp,
      goals: goals.filter((g) => g.employeeId === emp.id),
      totalWeight: goals
        .filter((g) => g.employeeId === emp.id && g.status !== "RETURNED")
        .reduce((s, g) => s + g.weightage, 0),
    }));

    return jsonResponse({ byEmployee, total: goals.length });
  } catch (err) {
    return handleApiError(err);
  }
}
