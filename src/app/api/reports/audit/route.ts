import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const logs = await prisma.auditLog.findMany({
      include: {
        goal: { select: { title: true, employeeId: true } },
        changedBy: { select: { name: true, email: true } },
      },
      orderBy: { changedAt: "desc" },
      take: 200,
    });

    return jsonResponse({ logs });
  } catch (err) {
    return handleApiError(err);
  }
}
