import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertCycleWindow } from "@/lib/cycles";
import {
  MAX_GOALS,
  TOTAL_WEIGHT,
  validateWeightage,
} from "@/lib/validations";
import {
  errorResponse,
  jsonResponse,
  handleApiError,
} from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");

    const goals = await prisma.goal.findMany({
      where: {
        employeeId: user.id,
        ...(cycleId && { cycleId }),
      },
      include: {
        thrustArea: true,
        achievements: { orderBy: { submittedAt: "desc" }, take: 4 },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalWeight = goals
      .filter((g) => g.status !== "RETURNED")
      .reduce((s, g) => s + g.weightage, 0);

    return jsonResponse({
      goals,
      totalWeight,
      remaining: TOTAL_WEIGHT - totalWeight,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    const body = await request.json();
    const {
      cycleId,
      thrustAreaId,
      title,
      description,
      uomType,
      target,
      targetDate,
      weightage,
    } = body;

    const windowCheck = await assertCycleWindow(cycleId);
    if (!windowCheck.ok) return errorResponse(windowCheck.error!);

    const count = await prisma.goal.count({
      where: {
        employeeId: user.id,
        cycleId,
        status: { not: "RETURNED" },
      },
    });
    if (count >= MAX_GOALS) {
      return errorResponse(`Maximum ${MAX_GOALS} goals per employee per cycle`);
    }

    const wCheck = await validateWeightage(
      user.id,
      cycleId,
      parseFloat(weightage)
    );
    if (!wCheck.valid) return errorResponse(wCheck.error);

    const goal = await prisma.goal.create({
      data: {
        employeeId: user.id,
        cycleId,
        thrustAreaId,
        title,
        description,
        uomType,
        target: parseFloat(target),
        targetDate: targetDate ? new Date(targetDate) : null,
        weightage: parseFloat(weightage),
        status: "DRAFT",
      },
      include: { thrustArea: true },
    });

    return jsonResponse(goal, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
