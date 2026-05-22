import { Express } from "express";
import { storage } from "../storage";
import { log } from "../log";

export function registerAiRoutes(app: Express) {
  /**
   * Proxies a multimodal request to either local Ollama or Google Gemini.
   */
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const settings = await storage.getIntegrationSettings();
      const { image, prompt, systemPrompt } = req.body;
      if (!image) return res.status(400).json({ message: "No image provided." });

      const basePrompt = prompt || "What is happening in this game screenshot? Give me a helpful hint on what to do next.";
      const baseSystem = systemPrompt || "You are a retro gaming expert assistant. You analyze screenshots and provide helpful, concise hints to players who are stuck. Be encouraging but cryptic to avoid major spoilers.";

      const provider = settings.aiProvider || (settings.geminiApiKey ? "gemini" : "ollama");

      // ── Strategy 1: Google Gemini (Cloud) ─────────────────────────────────
      if (provider === "gemini" && settings.geminiApiKey) {
        log("Sending image to Google Gemini API", "ai");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settings.geminiApiKey}`;
        
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `${baseSystem}\n\nUser Question: ${basePrompt}` },
                { inline_data: { mime_type: "image/jpeg", data: image.split(",")[1] || image } }
              ]
            }]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const geminiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return res.json({ response: geminiResponse || "Gemini was unable to analyze the image." });
      }

      // ── Strategy 2: Local Ollama (Fallback or Explicit) ───────────────────
      if (!settings.ollamaUrl) {
        return res.status(400).json({ message: "AI Provider is set to Ollama but no Ollama URL is configured." });
      }

      log(`Sending image to Ollama at ${settings.ollamaUrl} (model: ${settings.ollamaModel})`, "ai");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch(`${settings.ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: settings.ollamaModel,
          prompt: basePrompt,
          system: baseSystem,
          images: [image.split(",")[1] || image],
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
      const provider = settings.aiProvider || (settings.geminiApiKey ? "gemini" : "ollama");
      
      // Test Gemini if selected
      if (provider === "gemini") {
        if (!settings.geminiApiKey) throw new Error("Gemini selected but no API Key provided.");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${settings.geminiApiKey}`;
        const resp = await fetch(url);
        if (resp.ok) {
          return res.json({ ok: true, provider: "gemini", message: "Successfully connected to Google Gemini API." });
        } else {
          throw new Error(`Gemini API key is invalid or restricted (Status: ${resp.status})`);
        }
      }

      // Otherwise test Ollama
      if (!settings.ollamaUrl) throw new Error("No AI provider (Gemini or Ollama) configured.");

      const response = await fetch(`${settings.ollamaUrl}/api/tags`);
      if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
      
      const data = await response.json();
      const models = data.models || [];
      const hasVision = models.some((m: any) => m.name.includes("llava") || m.name.includes("vision"));

      res.json({ 
        ok: true, 
        provider: "ollama",
        models: models.map((m: any) => m.name),
        hasVisionModel: hasVision
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, message: err.message });
    }
  });
}
