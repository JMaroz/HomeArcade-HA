import { Express } from "express";
import { storage } from "../storage";
import { log } from "../log";

export function registerAiRoutes(app: Express) {
  /**
   * Proxies a multimodal request to the local Ollama instance.
   * Expects JSON: { image: "base64...", prompt: "string", system: "string" }
   */
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const settings = await storage.getIntegrationSettings();
      if (!settings.ollamaUrl) {
        return res.status(400).json({ message: "Ollama URL not configured in Settings." });
      }

      const { image, prompt, systemPrompt } = req.body;
      if (!image) return res.status(400).json({ message: "No image provided." });

      log(`Sending image to Ollama at ${settings.ollamaUrl} (model: ${settings.ollamaModel})`, "ai");

      const response = await fetch(`${settings.ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: settings.ollamaModel,
          prompt: prompt || "What is happening in this game screenshot? Give me a helpful hint on what to do next.",
          system: systemPrompt || "You are a retro gaming expert assistant. You analyze screenshots and provide helpful, concise hints to players who are stuck. Be encouraging but cryptic to avoid major spoilers.",
          images: [image.split(",")[1] || image], // Strip data:image/png;base64, prefix if present
          stream: false
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      res.json({ response: data.response });
    } catch (err: any) {
      log(`AI analysis failed: ${err.message}`, "ai");
      res.status(500).json({ message: `AI Assistant unavailable: ${err.message}` });
    }
  });
}
