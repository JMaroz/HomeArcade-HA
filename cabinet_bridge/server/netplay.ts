/**
 * HomeArcade — Netplay WebSocket relay server
 *
 * Provides the signalling layer that EmulatorJS netplay needs.
 * Two peers pair via a 6-char room code; all subsequent messages
 * are forwarded verbatim between them so EmulatorJS can establish
 * its own game-state synchronisation channel.
 *
 * Endpoint: ws(s)://<host><ingressBase>/api/netplay
 * Set as window.EJS_netplayUrl in the player bootstrap.
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";

interface NetplayRoom {
  host: WebSocket | null;
  client: WebSocket | null;
  romHash: string | null;
  createdAt: number;
  lastActive: number;
  deleteTimer?: NodeJS.Timeout;
}

const rooms = new Map<string, NetplayRoom>();

// Prune stale rooms every minute (rooms inactive for more than 10 minutes)
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [code, room] of Array.from(rooms.entries())) {
    if (room.lastActive < cutoff && !room.host && !room.client) {
      rooms.delete(code);
    }
  }
}, 60 * 1000);

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? generateRoomCode() : code;
}

function send(ws: WebSocket, obj: object) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

export function attachNetplayServer(httpServer: HttpServer) {
  // Use a faster perMessageDeflate configuration and disable Nagle's algorithm
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: "/api/netplay",
    perMessageDeflate: false // Deflate adds CPU latency; usually not worth it for small input packets
  });

  wss.on("connection", (ws: WebSocket, req) => {
    // Disable Nagle's algorithm for lower latency
    (ws as any)._socket?.setNoDelay?.(true);
    
    let roomCode: string | null = null;
    let role: "host" | "client" | null = null;

    ws.on("message", (raw: Buffer | string, isBinary: boolean) => {
      // Fast path: if we are in a room and have a peer, relay immediately
      if (roomCode) {
        const room = rooms.get(roomCode);
        if (room) {
          const peer = role === "host" ? room.client : room.host;
          if (peer && peer.readyState === WebSocket.OPEN) {
            // Relaying raw data (binary or string) without any processing
            peer.send(raw, { binary: isBinary });
            return;
          }
        }
      }

      // Control path: only parse JSON if we are not yet in a stable relay state or need to handle commands
      let msg: Record<string, unknown> | null = null;
      try { 
        msg = JSON.parse(raw.toString()); 
      } catch { 
        return; // Not a control message, and no peer to relay to
      }

      if (msg) {
        const type = msg.type as string | undefined;

        // PING/PONG for latency measurement
        if (type === "ping") {
          send(ws, { type: "pong", ts: msg.ts });
          return;
        }

        // HOSTING or RE-JOINING as host
        if (type === "create-room" || type === "host") {
          const code = (msg.room as string | undefined)?.toUpperCase();
          
          if (code && rooms.has(code)) {
            const room = rooms.get(code)!;
            if (room.host && room.host !== ws) {
               send(ws, { type: "error", message: "Host slot already occupied." });
               return;
            }
            roomCode = code;
            role = "host";
            room.host = ws;
            room.lastActive = Date.now();
            if (room.deleteTimer) { clearTimeout(room.deleteTimer); delete room.deleteTimer; }
            send(ws, { type: "room-created", room: roomCode }); 
            return;
          }

          if (roomCode) return;
          roomCode = generateRoomCode();
          role = "host";
          rooms.set(roomCode, { 
            host: ws, 
            client: null, 
            romHash: (msg.romHash as string) || null,
            createdAt: Date.now(),
            lastActive: Date.now()
          });
          send(ws, { type: "room-created", room: roomCode });
          return;
        }

        // JOINING or RE-JOINING as client
        if (type === "join-room" || type === "client") {
          const code = ((msg.room ?? msg.roomId) as string | undefined)?.toUpperCase();
          if (!code) { send(ws, { type: "error", message: "Missing room code." }); return; }
          
          const room = rooms.get(code);
          if (!room) { send(ws, { type: "error", message: "Room not found." }); return; }
          
          if (room.client && room.client !== ws) { 
            send(ws, { type: "error", message: "Room is full." }); 
            return; 
          }

          // Validate ROM hash if both exist
          if (room.romHash && msg.romHash && room.romHash !== msg.romHash) {
            send(ws, { 
              type: "error", 
              message: "ROM Mismatch: Desync will occur." 
            });
            return;
          }

          roomCode = code;
          role = "client";
          room.client = ws;
          room.lastActive = Date.now();
          if (room.deleteTimer) { clearTimeout(room.deleteTimer); delete room.deleteTimer; }
          
          send(ws, { type: "room-joined", room: roomCode });
          if (room.host) send(room.host, { type: "peer-joined" });
          return;
        }
      }
    });

    ws.on("close", () => {
      if (!roomCode) return;
      const room = rooms.get(roomCode);
      if (!room) return;

      if (role === "host") room.host = null;
      else if (role === "client") room.client = null;

      room.lastActive = Date.now();

      const peer = role === "host" ? room.client : room.host;
      if (peer && peer.readyState === WebSocket.OPEN) {
        send(peer, { type: "peer-disconnected", role });
      }

      if (!room.host && !room.client) {
        if (room.deleteTimer) clearTimeout(room.deleteTimer);
        room.deleteTimer = setTimeout(() => {
          if (!room.host && !room.client) {
            rooms.delete(roomCode!);
          }
        }, 30000); 
      }
    });

    ws.on("error", () => {});
  });

  console.log("[HomeArcade] Netplay relay optimized for low-latency attached at /api/netplay");
}

export function listOpenRooms(): { code: string; romHash: string | null; createdAt: number }[] {
  return Array.from(rooms.entries())
    .filter(([, room]) => room.client === null)
    .map(([code, room]) => ({ 
      code, 
      romHash: room.romHash,
      createdAt: room.createdAt 
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}
