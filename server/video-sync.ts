import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface SyncMessage {
  type: "video-play" | "video-pause" | "video-seek";
  currentTime: number;
  lineIndex?: number;
}

const rooms = new Map<string, Set<WebSocket>>();

export function setupVideoSync(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/video-sync" });

  wss.on("connection", (ws, req) => {
    const rawUrl = req.url ?? "";
    const url = new URL(rawUrl, `http://${req.headers.host ?? "localhost"}`);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      ws.close(1008, "sessionId required");
      return;
    }

    if (!rooms.has(sessionId)) {
      rooms.set(sessionId, new Set());
    }
    rooms.get(sessionId)!.add(ws);

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString()) as SyncMessage;
        const room = rooms.get(sessionId);
        if (!room) return;
        const payload = JSON.stringify(msg);
        for (const client of room) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        }
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
      }
    });

    ws.on("error", () => {
      const room = rooms.get(sessionId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          rooms.delete(sessionId);
        }
      }
    });
  });
}
