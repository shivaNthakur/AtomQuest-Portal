import { requireSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { channelRoom } from "@/lib/chat-rooms";
import { emitToRoom } from "@/lib/socket-events";
import { errorResponse, jsonResponse, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    const channelId = new URL(request.url).searchParams.get("channelId");
    if (!channelId) return errorResponse("channelId required");

    const member = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: user.id } },
    });
    if (!member) return errorResponse("Not a member of this channel", 403);

    const messages = await prisma.message.findMany({
      where: { channelId },
      include: { sender: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return jsonResponse({ messages });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionFromRequest(request);
    const { channelId, content } = await request.json();
    if (!content?.trim()) return errorResponse("Message content required");

    const member = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: user.id } },
    });
    if (!member) return errorResponse("Not a member of this channel", 403);

    const message = await prisma.message.create({
      data: { channelId, content: content.trim(), senderId: user.id },
      include: { sender: { select: { id: true, name: true, email: true } } },
    });

    emitToRoom(channelRoom(channelId), "chat_message", { ...message, channelId });

    return jsonResponse(message, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
