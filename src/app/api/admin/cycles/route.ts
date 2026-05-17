import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const cycles = await prisma.goalCycle.findMany({
      orderBy: [{ year: "desc" }, { phase: "asc" }],
    });
    return jsonResponse({ cycles });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    if (user.role !== "ADMIN") return errorResponse("Forbidden", 403);

    const body = await request.json();
    const { year, phase, opensAt, closesAt, isActive } = body;

    if (isActive) {
      await prisma.goalCycle.updateMany({
        where: { phase },
        data: { isActive: false },
      });
    }

    const cycle = await prisma.goalCycle.upsert({
      where: { year_phase: { year, phase } },
      create: {
        year,
        phase,
        opensAt: new Date(opensAt),
        closesAt: new Date(closesAt),
        isActive: !!isActive,
      },
      update: {
        opensAt: new Date(opensAt),
        closesAt: new Date(closesAt),
        isActive: !!isActive,
      },
    });

    return jsonResponse(cycle, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
