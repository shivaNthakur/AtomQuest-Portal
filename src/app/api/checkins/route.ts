import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitToUser } from "@/lib/socket-events";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role === "EMPLOYEE") return errorResponse("Forbidden", 403);

    const { achievementId, cycleId, comment } = await request.json();
    if (!comment?.trim()) return errorResponse("Comment is required");

    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
      include: { goal: { include: { employee: true } } },
    });

    if (!achievement) return errorResponse("Achievement not found", 404);
    if (
      user.role !== "ADMIN" &&
      achievement.goal.employee.managerId !== user.id
    ) {
      return errorResponse("Not authorized for this employee", 403);
    }

    const checkin = await prisma.managerCheckin.upsert({
      where: {
        managerId_achievementId_cycleId: {
          managerId: user.id,
          achievementId,
          cycleId,
        },
      },
      create: {
        managerId: user.id,
        achievementId,
        cycleId,
        comment: comment.trim(),
      },
      update: { comment: comment.trim(), checkedInAt: new Date() },
    });

    emitToUser(achievement.goal.employeeId, "checkin_added", {
      achievementId,
      managerName: user.name,
    });

    return jsonResponse(checkin, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
