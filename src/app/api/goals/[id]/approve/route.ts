import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditChange } from "@/lib/audit";
import { sendEmail } from "@/lib/mailer";
import { emitToUser, emitToTeam } from "@/lib/socket-events";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role === "EMPLOYEE") return errorResponse("Forbidden", 403);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { target, weightage } = body;

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { employee: { select: { managerId: true, email: true, name: true } } },
    });

    if (!goal) return errorResponse("Goal not found", 404);
    if (goal.status !== "SUBMITTED") {
      return errorResponse("Goal is not in SUBMITTED state");
    }
    if (
      user.role !== "ADMIN" &&
      goal.employee.managerId !== user.id
    ) {
      return errorResponse("Not the L1 manager for this employee", 403);
    }

    const updated = await prisma.goal.update({
      where: { id: goal.id },
      data: {
        status: "LOCKED",
        approvedBy: user.id,
        approvedAt: new Date(),
        lockedAt: new Date(),
        ...(target !== undefined && { target: parseFloat(target) }),
        ...(weightage !== undefined && { weightage: parseFloat(weightage) }),
      },
    });

    if (target !== undefined && target !== goal.target) {
      await auditChange(
        goal.id,
        user.id,
        "target",
        String(goal.target),
        String(target),
        "Manager edited during approval"
      );
    }
    if (weightage !== undefined && weightage !== goal.weightage) {
      await auditChange(
        goal.id,
        user.id,
        "weightage",
        String(goal.weightage),
        String(weightage),
        "Manager edited during approval"
      );
    }

    sendEmail({
      to: goal.employee.email,
      subject: "AtomQuest: Goal approved",
      text: `Hello ${goal.employee.name},\n\nYour goal "${goal.title}" has been approved and locked.`,
    });

    emitToUser(goal.employeeId, "goal_approved", { goalId: goal.id });
    if (goal.employee.managerId) {
      emitToTeam(goal.employee.managerId, "goal_approved", {
        goalId: goal.id,
        employeeId: goal.employeeId,
      });
    }

    return jsonResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
