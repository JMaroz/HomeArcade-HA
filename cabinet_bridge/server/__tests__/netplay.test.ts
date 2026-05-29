import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, type Server } from "http";
import express from "express";
import { WebSocket } from "ws";
import { attachNetplayServer } from "../netplay";

describe("Netplay Relay Server", () => {
  let server: Server;
  let port: number;

  beforeAll(() => {
    const app = express();
    server = createServer(app);
    attachNetplayServer(server);
    return new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as any).port;
        resolve();
      });
    });
  });

  afterAll(() => {
    server.close();
  });

  const getWsUrl = () => `ws://localhost:${port}/api/netplay`;

  it("should allow a host to create a room", () => {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(getWsUrl());
      ws.on("open", () => {
        ws.send(JSON.stringify({ type: "create-room", romHash: "abc-123" }));
      });
      ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        expect(msg.type).toBe("room-created");
        expect(msg.room).toHaveLength(6);
        ws.close();
        resolve();
      });
      ws.on("error", reject);
    });
  });

  it("should relay messages between host and client", () => {
    return new Promise<void>((resolve, reject) => {
      const hostWs = new WebSocket(getWsUrl());
      let roomCode: string;

      hostWs.on("open", () => {
        hostWs.send(JSON.stringify({ type: "create-room" }));
      });

      hostWs.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === "room-created") {
          roomCode = msg.room;
          const clientWs = new WebSocket(getWsUrl());
          clientWs.on("open", () => {
            clientWs.send(JSON.stringify({ type: "join-room", room: roomCode }));
          });
          clientWs.on("message", (clientData) => {
            const clientMsg = JSON.parse(clientData.toString());
            if (clientMsg.type === "room-joined") {
              clientWs.send(JSON.stringify({ type: "sync", data: "test-state" }));
            }
          });
        } else if (msg.type === "sync") {
          expect(msg.data).toBe("test-state");
          hostWs.close();
          resolve();
        }
      });
      hostWs.on("error", reject);
    });
  });

  it("should notify peer when one disconnects", () => {
    return new Promise<void>((resolve, reject) => {
      const hostWs = new WebSocket(getWsUrl());
      let roomCode: string;

      hostWs.on("open", () => {
        hostWs.send(JSON.stringify({ type: "create-room" }));
      });

      hostWs.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === "room-created") {
          roomCode = msg.room;
          const clientWs = new WebSocket(getWsUrl());
          clientWs.on("open", () => {
            clientWs.send(JSON.stringify({ type: "join-room", room: roomCode }));
          });
          clientWs.on("message", (clientData) => {
            const clientMsg = JSON.parse(clientData.toString());
            if (clientMsg.type === "room-joined") {
              clientWs.close(); // Disconnect client
            }
          });
        } else if (msg.type === "peer-disconnected") {
          expect(msg.role).toBe("client");
          hostWs.close();
          resolve();
        }
      });
      hostWs.on("error", reject);
    });
  });
});
