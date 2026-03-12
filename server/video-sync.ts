import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface SyncMessage {
  type: "video-play" | "video-pause" | "video-seek" | "grant-permission" | "revoke-permission" | "sync-loop" | "toggle-global-control" | "revoke-all" | "permission-sync" | "presence-sync";
  currentTime?: number;
  lineIndex?: number;
  targetUserId?: string;
  loopRange?: { start: number; end: number } | null;
  userId?: string;
  role?: string;
  globalControl?: boolean;
  permissions?: string[];
  users?: Array<{ userId: string; name: string; role?: string }>;
}

const rooms = new Map<string, Set<WebSocket & { userId?: string; role?: string; name?: string }>>();
const tempPermissions = new Map<string, Set<string>>(); // sessionId -> Set of userIds with temp permission
const globalControlSessions = new Map<string, boolean>(); // sessionId -> global control enabled

function getRoster(room: Set<WebSocket & { userId?: string; role?: string; name?: string }>) {
  const users: Array<{ userId: string; name: string; role?: string }> = [];
  room.forEach((ws) => {
    if (!ws.userId) return;
    users.push({ userId: ws.userId, name: ws.name || "Usuario", role: ws.role });
  });
  return users;
}

function broadcast(room: Set<WebSocket>, data: any) {
  const payload = JSON.stringify(data);
  room.forEach((client: any) => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
}

export function setupVideoSync(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/video-sync" });

  wss.on("connection", (ws: WebSocket & { userId?: string; role?: string; name?: string }, req) => {
    const rawUrl = req.url ?? "";
    const url = new URL(rawUrl, `http://${req.headers.host ?? "localhost"}`);
    const sessionId = url.searchParams.get("sessionId");
    const userId = url.searchParams.get("userId");
    const role = url.searchParams.get("role");
    const name = url.searchParams.get("name");

    if (!sessionId || !userId) {
      ws.close(1008, "sessionId and userId required");
      return;
    }

    ws.userId = userId;
    ws.role = role || "actor";
    ws.name = name || "Usuario";

    if (!rooms.has(sessionId)) {
      rooms.set(sessionId, new Set());
    }
    rooms.get(sessionId)!.add(ws);

    const room = rooms.get(sessionId)!;
    const perms = Array.from(tempPermissions.get(sessionId) || []);
    const globalControl = globalControlSessions.get(sessionId) || false;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "permission-sync", permissions: perms, globalControl } satisfies SyncMessage));
      ws.send(JSON.stringify({ type: "presence-sync", users: getRoster(room) } satisfies SyncMessage));
    }
    broadcast(room as any, { type: "presence-sync", users: getRoster(room) } satisfies SyncMessage);

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString()) as SyncMessage;
        const room = rooms.get(sessionId);
        if (!room) return;

        // RBAC Check
        const roleStr = String(ws.role || "").toLowerCase();
        const isPrivileged = ["director", "teacher", "audio_engineer", "admin", "owner", "platform_owner", "studio_admin", "diretor", "engenheiro_audio"].includes(roleStr);
        const hasTempPermission = tempPermissions.get(sessionId)?.has(ws.userId || "");
        const isGlobalEnabled = globalControlSessions.get(sessionId) || false;
        const canControl = isPrivileged || hasTempPermission || isGlobalEnabled;

        if (msg.type === "grant-permission" || msg.type === "revoke-permission" || msg.type === "toggle-global-control" || msg.type === "revoke-all") {
          if (!isPrivileged) return; // Only privileged users can manage permissions

          if (msg.type === "grant-permission" && msg.targetUserId) {
            if (!tempPermissions.has(sessionId)) tempPermissions.set(sessionId, new Set());
            tempPermissions.get(sessionId)!.add(msg.targetUserId);
          } else if (msg.type === "revoke-permission" && msg.targetUserId) {
            tempPermissions.get(sessionId)?.delete(msg.targetUserId);
          } else if (msg.type === "toggle-global-control") {
            globalControlSessions.set(sessionId, !!msg.globalControl);
          } else if (msg.type === "revoke-all") {
            tempPermissions.get(sessionId)?.clear();
            globalControlSessions.set(sessionId, false);
          }

          const permissions = Array.from(tempPermissions.get(sessionId) || []);
          const globalControl = globalControlSessions.get(sessionId) || false;
          broadcast(room as any, { type: "permission-sync", permissions, globalControl } satisfies SyncMessage);
        } else if (!canControl) {
          // If not privileged and no temp permission, ignore control messages
          return;
        }

        const payload = JSON.stringify({ ...msg, userId: ws.userId });
        room.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        });
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      const room = rooms.get(sessionId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          rooms.delete(sessionId);
        }
        broadcast(room as any, { type: "presence-sync", users: getRoster(room as any) } satisfies SyncMessage);
      }
    });

    ws.on("error", () => {
      const room = rooms.get(sessionId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          rooms.delete(sessionId);
        }
        broadcast(room as any, { type: "presence-sync", users: getRoster(room as any) } satisfies SyncMessage);
      }
    });
  });
}
