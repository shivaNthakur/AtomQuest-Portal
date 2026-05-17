import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertCycleWindow } from "@/lib/cycles";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role === "EMPLOYEE") return errorResponse("Forbidden", 403);

    const body = await request.json();
    const {
      cycleId,
      thrustAreaId,
      title,
      description,
      uomType,
      target,
      targetDate,
      recipientIds,
      primaryOwnerId,
    } = body;

    if (!recipientIds?.length) {
      return errorResponse("No recipients specified");
    }

    const windowCheck = await assertCycleWindow(cycleId);
    if (!windowCheck.ok) return errorResponse(windowCheck.error!);

    const primaryEmployeeId = primaryOwnerId || recipientIds[0];

    const masterGoal = await prisma.goal.create({
      data: {
        employeeId: primaryEmployeeId,
        cycleId,
        thrustAreaId,
        title,
        description,
        uomType,
        target: parseFloat(target),
        targetDate: targetDate ? new Date(targetDate) : null,
        weightage: 0,
        isShared: true,
        primaryOwnerId: primaryEmployeeId,
        status: "LOCKED",
        approvedBy: user.id,
        approvedAt: new Date(),
        lockedAt: new Date(),
      },
    });

    for (const recipientId of recipientIds) {
      await prisma.goal.create({
        data: {
          employeeId: recipientId,
          cycleId,
          thrustAreaId,
          title,
          description,
          uomType,
          target: parseFloat(target),
          targetDate: targetDate ? new Date(targetDate) : null,
          weightage: 10,
          isShared: true,
          primaryOwnerId: primaryEmployeeId,
          status: "LOCKED",
          approvedBy: user.id,
          approvedAt: new Date(),
          lockedAt: new Date(),
        },
      });

      await prisma.sharedGoalLink.create({
        data: {
          masterGoalId: masterGoal.id,
          recipientId,
          weightage: 10,
        },
      });
    }

    return jsonResponse(
      { masterGoal, recipientCount: recipientIds.length, primaryOwnerId: primaryEmployeeId },
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}
