import type { Server as SocketServer } from "socket.io";

let io: SocketServer | null = null;

export function setSocketServer(server: SocketServer) {
  io = server;
}

export function getSocketServer() {
  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToManager(managerId: string, event: string, payload: unknown) {
  io?.to(`manager:${managerId}`).emit(event, payload);
}

export function emitToTeam(managerId: string, event: string, payload: unknown) {
  io?.to(`team:${managerId}`).emit(event, payload);
}

export function emitToAdmins(event: string, payload: unknown) {
  io?.to("role:ADMIN").emit(event, payload);
}

export function emitToRoom(room: string, event: string, payload: unknown) {
  io?.to(room).emit(event, payload);
}
