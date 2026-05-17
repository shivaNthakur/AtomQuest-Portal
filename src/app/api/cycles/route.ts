import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    await requireSessionFromRequest(request);
    const cycles = await prisma.goalCycle.findMany({
      orderBy: [{ year: "desc" }, { phase: "asc" }],
    });
    return jsonResponse({ cycles });
  } catch (err) {
    return handleApiError(err);
  }
}
