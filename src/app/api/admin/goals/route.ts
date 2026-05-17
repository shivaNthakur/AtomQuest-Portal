import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const goals = await prisma.goal.findMany({
      where: { status: "LOCKED" },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        thrustArea: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return jsonResponse({ goals });
  } catch (err) {
    return handleApiError(err);
  }
}
