import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        channelMemberships: {
          include: {
            channel: {
              include: {
                messages: { orderBy: { createdAt: "desc" }, take: 1 },
              },
            },
          },
        },
      },
    });

    const channels = dbUser?.channelMemberships.map((m) => m.channel) ?? [];
    return jsonResponse({ channels });
  } catch (err) {
    return handleApiError(err);
  }
}
