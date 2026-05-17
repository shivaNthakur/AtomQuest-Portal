import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import cron from "node-cron";
import { prisma } from "./src/lib/prisma";
import {
  orgRoom,
  deptRoom,
  teamRoom,
  channelRoom,
} from "./src/lib/chat-rooms";
import { setSocketServer } from "./src/lib/socket-events";
import { runEscalations } from "./src/jobs/escalations";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function initRedisAdapter(io: Server) {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn("REDIS_URL not set — Socket.io running without Redis adapter");
    return;
  }
  try {
    const pub = new Redis(redisUrl);
    const sub = pub.duplicate();
    io.adapter(createAdapter(pub, sub));
    console.log("Socket.io Redis adapter connected");
  } catch (err) {
    console.warn("Redis adapter failed:", (err as Error).message);
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      credentials: true,
    },
  });

  initRedisAdapter(io);
  setSocketServer(io);

  io.use(async (socket, nextFn) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return nextFn(new Error("Unauthorized"));
    try {
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      socket.data.user = payload;
      nextFn();
    } catch {
      nextFn(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.data.user as {
      id: string;
      role: string;
      managerId?: string;
    };
    if (!user?.id) return;

    socket.join(`user:${user.id}`);
    socket.join(orgRoom());
    if (user.role === "MANAGER") socket.join(`manager:${user.id}`);
    if (user.role === "ADMIN") socket.join("role:ADMIN");
    if (user.managerId) socket.join(`team:${user.managerId}`);

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { channelMemberships: true },
      });
      if (dbUser?.departmentId) socket.join(deptRoom(dbUser.departmentId));
      if (dbUser?.teamId) socket.join(teamRoom(dbUser.teamId));
      for (const m of dbUser?.channelMemberships ?? []) {
        socket.join(channelRoom(m.channelId));
      }
    } catch (e) {
      console.warn("Socket room join failed:", (e as Error).message);
    }
  });

  cron.schedule("0 9 * * *", () => {
    console.log("Running daily escalation job…");
    runEscalations().catch(console.error);
  });

  httpServer.listen(port, () => {
    console.log(`> AtomQuest ready on http://${hostname}:${port}`);
  });
});
