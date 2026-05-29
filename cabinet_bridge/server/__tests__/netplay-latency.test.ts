import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, type Server } from "http";
import express from "express";
import { WebSocket } from "ws";
import { attachNetplayServer } from "../netplay";

describe("Netplay Latency Simulation", () => {
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

  it("should handle messages with simulated network jitter", () => {
    return new Promise<void>((resolve, reject) => {
      const hostWs = new WebSocket(getWsUrl());
      let roomCode: string;
      const receivedMessages: string[] = [];
      const totalMessages = 5;

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
              // Send messages with random delays to simulate jitter
              for (let i = 0; i < totalMessages; i++) {
                setTimeout(() => {
                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify({ type: "input", seq: i }));
                  }
                }, Math.random() * 100);
              }
            }
          });
        } else if (msg.type === "input") {
          receivedMessages.push(msg.seq);
          if (receivedMessages.length === totalMessages) {
            expect(receivedMessages.length).toBe(totalMessages);
            hostWs.close();
            resolve();
          }
        }
      });
      hostWs.on("error", reject);
    });
  });
});
