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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch(`${settings.ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: settings.ollamaModel,
          prompt: prompt || "What is happening in this game screenshot? Give me a helpful hint on what to do next.",
          system: systemPrompt || "You are a retro gaming expert assistant. You analyze screenshots and provide helpful, concise hints to players who are stuck. Be encouraging but cryptic to avoid major spoilers.",
          images: [image.split(",")[1] || image], // Strip data:image/png;base64, prefix if present
          stream: false
        }),
      });

      clearTimeout(timeoutId);

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

  app.get("/api/ai/test", async (_req, res) => {
    try {
      const settings = await storage.getIntegrationSettings();
      if (!settings.ollamaUrl) throw new Error("Ollama URL not configured.");

      const response = await fetch(`${settings.ollamaUrl}/api/tags`);
      if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
      
      const data = await response.json();
      const models = data.models || [];
      const hasVision = models.some((m: any) => m.name.includes("llava") || m.name.includes("vision"));

      res.json({ 
        ok: true, 
        models: models.map((m: any) => m.name),
        hasVisionModel: hasVision
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });
}
