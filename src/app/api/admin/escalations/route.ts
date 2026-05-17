import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const escalations = await prisma.escalation.findMany({
      include: {
        targetUser: { select: { name: true, email: true, role: true } },
        resolvedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return jsonResponse({ escalations });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const { id } = await request.json();
    const updated = await prisma.escalation.update({
      where: { id },
      data: { resolvedAt: new Date(), resolvedById: user.id },
    });

    return jsonResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
