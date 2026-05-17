import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertCycleWindow } from "@/lib/cycles";
import { TOTAL_WEIGHT } from "@/lib/validations";
import { sendEmail } from "@/lib/mailer";
import {
  emitToManager,
  emitToUser,
} from "@/lib/socket-events";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    const { cycleId } = await request.json();

    const windowCheck = await assertCycleWindow(cycleId);
    if (!windowCheck.ok) return errorResponse(windowCheck.error!);

    const goals = await prisma.goal.findMany({
      where: {
        employeeId: user.id,
        cycleId,
        status: { in: ["DRAFT", "RETURNED"] },
      },
    });

    if (goals.length === 0) {
      return errorResponse("No draft goals to submit");
    }

    const totalWeight = goals.reduce((s, g) => s + g.weightage, 0);
    if (Math.abs(totalWeight - TOTAL_WEIGHT) > 0.01) {
      return errorResponse(
        `Total weightage must equal ${TOTAL_WEIGHT}%. Current: ${totalWeight}%`
      );
    }

    await prisma.goal.updateMany({
      where: { id: { in: goals.map((g) => g.id) } },
      data: { status: "SUBMITTED" },
    });

    if (user.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: user.managerId },
      });
      if (manager) {
        sendEmail({
          to: manager.email,
          subject: `AtomQuest: ${user.name} submitted goals`,
          text: `Hello ${manager.name},\n\n${user.name} has submitted their goals for approval.`,
        });
        emitToManager(user.managerId, "goals_submitted", {
          employeeId: user.id,
          employeeName: user.name,
          count: goals.length,
        });
      }
    }

    emitToUser(user.id, "goals_submitted", { cycleId, count: goals.length });

    return jsonResponse({
      message: `${goals.length} goal(s) submitted for approval`,
      totalWeight,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
