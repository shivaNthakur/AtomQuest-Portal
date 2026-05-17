import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateWeightage } from "@/lib/validations";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSessionFromRequest(request);
    const { id } = await params;
    const goal = await prisma.goal.findUnique({ where: { id } });

    if (!goal) return errorResponse("Goal not found", 404);
    if (goal.employeeId !== user.id) return errorResponse("Forbidden", 403);

    const body = await request.json();
    const { weightage } = body;

    if (goal.isShared && goal.status === "LOCKED") {
      if (weightage === undefined) {
        return errorResponse(
          "Shared goals: only weightage can be adjusted (title and target are read-only)"
        );
      }
      const wCheck = await validateWeightage(
        user.id,
        goal.cycleId,
        parseFloat(weightage),
        goal.id
      );
      if (!wCheck.valid) return errorResponse(wCheck.error);
      const updated = await prisma.goal.update({
        where: { id: goal.id },
        data: { weightage: parseFloat(weightage) },
        include: { thrustArea: true },
      });
      return jsonResponse(updated);
    }

    if (!["DRAFT", "RETURNED"].includes(goal.status)) {
      return errorResponse("Only DRAFT or RETURNED goals can be edited");
    }

    if (weightage !== undefined) {
      const wCheck = await validateWeightage(
        user.id,
        goal.cycleId,
        parseFloat(weightage),
        goal.id
      );
      if (!wCheck.valid) return errorResponse(wCheck.error);
    }

    const { ...rest } = body;
    const updated = await prisma.goal.update({
      where: { id: goal.id },
      data: {
        ...(rest.title !== undefined && { title: rest.title }),
        ...(rest.description !== undefined && { description: rest.description }),
        ...(weightage !== undefined && { weightage: parseFloat(weightage) }),
        ...(rest.target !== undefined && { target: parseFloat(rest.target) }),
        ...(rest.targetDate && { targetDate: new Date(rest.targetDate) }),
        ...(rest.uomType && { uomType: rest.uomType }),
      },
      include: { thrustArea: true },
    });

    return jsonResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSessionFromRequest(request);
    const { id } = await params;
    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal) return errorResponse("Goal not found", 404);
    if (goal.employeeId !== user.id) return errorResponse("Forbidden", 403);
    if (goal.isShared) return errorResponse("Shared goals cannot be deleted");
    if (goal.status !== "DRAFT") {
      return errorResponse("Only draft goals can be deleted");
    }
    await prisma.goal.delete({ where: { id } });
    return jsonResponse({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
