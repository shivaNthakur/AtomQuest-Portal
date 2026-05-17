import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitToUser } from "@/lib/socket-events";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "admin-summary" && user.role === "ADMIN") {
      const byDept = await prisma.feedback.groupBy({
        by: ["type"],
        _count: { id: true },
      });
      const recent = await prisma.feedback.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          recipient: { select: { name: true, department: true } },
          provider: { select: { name: true } },
        },
      });
      return jsonResponse({ byType: byDept, recent });
    }

    const inbox = await prisma.feedback.findMany({
      where: { recipientId: user.id },
      include: {
        provider: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const sent = await prisma.feedback.findMany({
      where: { providerId: user.id },
      include: {
        recipient: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return jsonResponse({ inbox, sent });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    const { recipientId, type, content, rating, isAnonymous } = await request.json();

    if (!recipientId || !content?.trim() || !type) {
      return errorResponse("recipientId, type, and content required");
    }

    const feedback = await prisma.feedback.create({
      data: {
        providerId: user.id,
        recipientId,
        type,
        content: content.trim(),
        rating: rating ? parseInt(rating, 10) : null,
        isAnonymous: !!isAnonymous,
      },
      include: {
        provider: { select: { id: true, name: true } },
      },
    });

    const payload = {
      ...feedback,
      provider: isAnonymous
        ? { id: "anon", name: "Anonymous" }
        : feedback.provider,
    };

    emitToUser(recipientId, "feedback_received", payload);

    return jsonResponse(payload, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
