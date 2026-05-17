import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    await requireSessionFromRequest(request);
    const thrustAreas = await prisma.thrustArea.findMany({
      orderBy: { name: "asc" },
    });
    return jsonResponse({ thrustAreas });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role !== "ADMIN") return errorResponse("Forbidden", 403);
    const { name } = await request.json();
    const thrustArea = await prisma.thrustArea.create({ data: { name } });
    return jsonResponse(thrustArea, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
