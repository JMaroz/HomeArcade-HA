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
  const wss = new WebSocketServer({ server: httpServer, path: "/api/netplay" });

  wss.on("connection", (ws: WebSocket) => {
    let roomCode: string | null = null;
    let role: "host" | "client" | null = null;

    ws.on("message", (raw: Buffer | string) => {
      let msg: Record<string, unknown> | null = null;
      try { msg = JSON.parse(raw.toString()); } catch { /* binary data — relay below */ }

      if (msg) {
        const type = msg.type as string | undefined;

        // HOSTING or RE-JOINING as host
        if (type === "create-room" || type === "host") {
          const code = (msg.room as string | undefined)?.toUpperCase();
          
          if (code && rooms.has(code)) {
            // Re-connecting to existing room as host
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
            console.log(`[netplay] Host connected to room ${roomCode}`);
            return;
          }

          // New room creation
          if (roomCode) { send(ws, { type: "error", message: "Already in a room." }); return; }
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
          console.log(`[netplay] Room ${roomCode} created (hash: ${msg.romHash || "none"})`);
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
              message: "ROM Mismatch: Your ROM version does not match the host's version. Desync will occur." 
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
          console.log(`[netplay] Peer joined room ${roomCode}`);
          return;
        }
      }

      // Relay everything else verbatim to the paired peer
      if (!roomCode) return;
      const room = rooms.get(roomCode);
      if (!room) return;
      const peer = role === "host" ? room.client : room.host;
      if (peer && peer.readyState === WebSocket.OPEN) peer.send(raw);
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

      // If room is empty, wait 30 seconds before final deletion
      // This allows for page transitions and refreshes
      if (!room.host && !room.client) {
        if (room.deleteTimer) clearTimeout(room.deleteTimer);
        room.deleteTimer = setTimeout(() => {
          if (!room.host && !room.client) {
            rooms.delete(roomCode!);
            console.log(`[netplay] Room ${roomCode} permanently closed after timeout`);
          }
        }, 30000); 
      }
      
      console.log(`[netplay] Room ${roomCode} - ${role} disconnected (grace period started)`);
    });

    ws.on("error", () => { /* close fires next */ });
  });

  console.log("[HomeArcade] Netplay relay attached at ws://<host>/api/netplay");
}

/**
 * Returns all rooms that are still waiting for a second player.
 * Used by GET /api/netplay/rooms to power the lobby UI.
 */
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
