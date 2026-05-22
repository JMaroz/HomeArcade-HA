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
    const ip = req.socket.remoteAddress;
    console.log(`[Netplay] New connection from ${ip}`);
    
    let roomCode: string | null = null;
    let role: "host" | "client" | null = null;

    ws.on("message", (raw: Buffer | string, isBinary: boolean) => {
      // Fast path: if we are in a room and have a peer, relay immediately
      if (roomCode) {
        const room = rooms.get(roomCode);
        if (room) {
          const peer = role === "host" ? room.client : room.host;
          if (peer && peer.readyState === WebSocket.OPEN) {
            peer.send(raw, { binary: isBinary });
            return;
          }
        }
      }

      // Control path
      let msg: Record<string, unknown> | null = null;
      try { 
        msg = JSON.parse(raw.toString()); 
      } catch { 
        return; 
      }

      if (msg) {
        const type = msg.type as string | undefined;

        if (type === "ping") {
          send(ws, { type: "pong", ts: msg.ts });
          return;
        }

        if (type === "create-room" || type === "host") {
          const code = (msg.room as string | undefined)?.toUpperCase();
          console.log(`[Netplay] Host request from ${ip} for room: ${code || "NEW"}`);
          
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
            send(ws, { type: "room-created", room: roomCode }); 
            return;
          }

          roomCode = code || generateRoomCode();
          role = "host";
          rooms.set(roomCode, { 
            host: ws, 
            client: null, 
            romHash: (msg.romHash as string) || null,
            createdAt: Date.now(),
            lastActive: Date.now()
          });
          console.log(`[Netplay] Room created: ${roomCode} by ${ip}`);
          send(ws, { type: "room-created", room: roomCode });
          return;
        }

        if (type === "join-room" || type === "client") {
          const code = ((msg.room ?? msg.roomId) as string | undefined)?.toUpperCase();
          console.log(`[Netplay] Join request from ${ip} for room: ${code}`);
          if (!code) { send(ws, { type: "error", message: "Missing room code." }); return; }
          
          const room = rooms.get(code);
          if (!room) { 
            console.log(`[Netplay] Join failed: Room ${code} not found`);
            send(ws, { type: "error", message: "Room not found." }); 
            return; 
          }
          
          if (room.client && room.client !== ws) { 
            send(ws, { type: "error", message: "Room is full." }); 
            return; 
          }

          roomCode = code;
          role = "client";
          room.client = ws;
          room.lastActive = Date.now();
          
          console.log(`[Netplay] Peer ${ip} joined room ${roomCode}`);
          send(ws, { type: "room-joined", room: roomCode });
          if (room.host) send(room.host, { type: "peer-joined" });
          return;
        }
      }
    });

    ws.on("close", () => {
      console.log(`[Netplay] Connection closed from ${ip}`);
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
