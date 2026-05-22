import { Express } from "express";
import { storage } from "../storage";

export function registerRetroAchievementsRoutes(app: Express) {
  /**
   * Fetches a summary of the user's RetroAchievements profile.
   * Uses API_GetUserSummary.php
   */
  app.get("/api/retroachievements/summary", async (_req, res) => {
    const settings = await storage.getIntegrationSettings();
    if (!settings.raUsername || !settings.raToken) {
      return res.status(400).json({ message: "RetroAchievements not configured." });
    }

    try {
      // Fetch user summary (points, rank, recent achievements)
      const url = `https://retroachievements.org/API/API_GetUserSummary.php?z=${settings.raUsername}&y=${settings.raToken}&u=${settings.raUsername}&g=5&a=5`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`RA API returned ${response.status}`);
      
      const data = await response.json();
      
      // Transform into a cleaner format for our UI
      res.json({
        totalPoints: data.TotalPoints || 0,
        totalAchievements: data.TotalAchievements || 0,
        rank: data.Rank || 0,
        recentAchievements: data.RecentAchievements || [],
        games: data.RecentlyPlayed || []
      });
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/retroachievements/game-info/:id", async (req, res) => {
    const id = req.params.id;
    const settings = await storage.getIntegrationSettings();
    if (!settings.raUsername || !settings.raToken) {
      return res.status(400).json({ message: "RetroAchievements not configured." });
    }

    try {
      const url = `https://retroachievements.org/API/API_GetGame.php?z=${settings.raUsername}&y=${settings.raToken}&i=${id}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`RA API returned ${response.status}`);
      res.json(await response.json());
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/retroachievements/user-progress/:id", async (req, res) => {
    const id = req.params.id;
    const settings = await storage.getIntegrationSettings();
    if (!settings.raUsername || !settings.raToken) {
      return res.status(400).json({ message: "RetroAchievements not configured." });
    }

    try {
      const url = `https://retroachievements.org/API/API_API_GetGameInfoAndUserProgress.php?z=${settings.raUsername}&y=${settings.raToken}&u=${settings.raUsername}&g=${id}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`RA API returned ${response.status}`);
      res.json(await response.json());
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });
}
