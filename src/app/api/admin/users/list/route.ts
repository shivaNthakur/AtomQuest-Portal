import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role === "EMPLOYEE") return errorResponse("Forbidden", 403);

    const users = await prisma.user.findMany({
      where:
        user.role === "ADMIN"
          ? { role: "EMPLOYEE" }
          : { managerId: user.id, role: "EMPLOYEE" },
      select: { id: true, name: true, email: true, department: true, teamId: true },
      orderBy: { name: "asc" },
    });

    return jsonResponse({ users });
  } catch (err) {
    return handleApiError(err);
  }
}
