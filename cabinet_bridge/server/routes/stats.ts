import { Express } from "express";
import { storage } from "../storage";

export function registerStatsRoutes(app: Express) {
  app.get("/api/stats/summary", async (_req, res) => {
    try {
      const summary = await storage.getPlayStatsSummary();
      const hallOfFame = await storage.getHallOfFame(3);
      const recentSessions = await storage.listRecentSessions(5);
      
      res.json({
        summary,
        hallOfFame,
        recentSessions
      });
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });
}
