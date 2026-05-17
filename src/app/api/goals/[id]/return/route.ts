import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { emitToUser } from "@/lib/socket-events";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role === "EMPLOYEE") return errorResponse("Forbidden", 403);

    const { id } = await params;
    const { reason } = await request.json();
    if (!reason) return errorResponse("Return reason is required");

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { employee: { select: { email: true, name: true } } },
    });
    if (!goal) return errorResponse("Goal not found", 404);
    if (goal.status !== "SUBMITTED") {
      return errorResponse("Goal is not SUBMITTED");
    }

    const updated = await prisma.goal.update({
      where: { id: goal.id },
      data: { status: "RETURNED", returnReason: reason },
    });

    sendEmail({
      to: goal.employee.email,
      subject: "AtomQuest: Goals returned for rework",
      text: `Hello ${goal.employee.name},\n\nYour goal "${goal.title}" was returned.\nReason: ${reason}`,
    });

    emitToUser(goal.employeeId, "goal_returned", {
      goalId: goal.id,
      reason,
    });

    return jsonResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
