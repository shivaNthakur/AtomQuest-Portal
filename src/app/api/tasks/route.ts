import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { teamRoom } from "@/lib/chat-rooms";
import { emitToRoom } from "@/lib/socket-events";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.teamId) return jsonResponse({ tasks: [] });

    const tasks = await prisma.task.findMany({
      where: { teamId: dbUser.teamId },
      include: {
        assignee: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { sortOrder: "asc" }],
    });

    return jsonResponse({ tasks, teamId: dbUser.teamId });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role === "EMPLOYEE") return errorResponse("Forbidden", 403);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.teamId) return errorResponse("No team assigned");

    const body = await request.json();
    const { title, description, assigneeId, dueDate, status } = body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        teamId: dbUser.teamId,
        assigneeId: assigneeId || null,
        creatorId: user.id,
        status: status || "TODO",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    emitToRoom(teamRoom(dbUser.teamId), "task_created", task);

    return jsonResponse(task, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
