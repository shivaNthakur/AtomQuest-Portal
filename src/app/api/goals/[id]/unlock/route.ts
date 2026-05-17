import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditChange } from "@/lib/audit";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const { id } = await params;
    const { reason } = await request.json();
    if (!reason) return errorResponse("Reason required to unlock a goal");

    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal) return errorResponse("Goal not found", 404);

    const updated = await prisma.goal.update({
      where: { id: goal.id },
      data: { status: "APPROVED", lockedAt: null },
    });

    await auditChange(
      goal.id,
      user.id,
      "status",
      "LOCKED",
      "APPROVED",
      reason
    );

    return jsonResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
