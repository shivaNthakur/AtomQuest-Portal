import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { teamRoom } from "@/lib/chat-rooms";
import { emitToRoom } from "@/lib/socket-events";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSessionFromRequest(request);
    const { id } = await params;
    const body = await request.json();

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return errorResponse("Task not found", 404);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser?.teamId !== task.teamId && user.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
        ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId }),
        ...(body.dueDate !== undefined && {
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
        }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
      include: { assignee: { select: { id: true, name: true } } },
    });

    emitToRoom(teamRoom(task.teamId), "task_moved", updated);

    return jsonResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
