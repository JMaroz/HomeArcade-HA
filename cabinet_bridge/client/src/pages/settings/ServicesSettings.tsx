/**
 * ServicesSettings — Online Services tab content for Settings page.
 * Covers RetroAchievements, TheGamesDB, ScreenScraper, and bulk scraping.
 */
import React, { useState } from "react";
import { useIntegration } from "@/lib/integration";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { apiUrl, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Image, Loader2, RefreshCw } from "lucide-react";
import { Section, Field } from "./SettingsShared";

export function ServicesSettings() {
  const { config, setConfig } = useIntegration();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; title?: string } | null>(null);

  const handleBulkScrape = async () => {
    if (scraping) return;
    setScraping(true);
    setProgress(null);
    try {
      const res = await fetch(apiUrl("/api/roms/scrape-all"), { method: "POST" });
      if (!res.ok) throw new Error(res.statusText);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Body reader not available");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "progress") setProgress({ current: data.current, total: data.total, title: data.title });
              else if (data.type === "complete") {
                toast({ title: "Bulk scrape complete", description: "Successfully refreshed art for all ROMs." });
                await queryClient.invalidateQueries({ queryKey: ["/api/roms"] });
              }
            } catch { /* ignore parse errors */ }
          }
        }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Bulk scrape failed", description: err instanceof Error ? err.message : "Network error." });
    } finally {
      setScraping(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-10">
      <Section title={t("settings.sections.scrapers.title")} description={t("settings.sections.scrapers.description")}>
        <div className="grid sm:grid-cols-2 gap-6">
          <Field label={t("settings.fields.tgdbApiKey.label")} hint={t("settings.fields.tgdbApiKey.hint")}>
            <Input value={config.tgdbApiKey} onChange={(e) => setConfig({ tgdbApiKey: e.target.value })} placeholder="Your API Key" className="font-mono text-sm" />
          </Field>
          <div className="grid gap-4">
            <Field label={t("settings.fields.ssUserId.label")}>
              <Input value={config.ssUserId} onChange={(e) => setConfig({ ssUserId: e.target.value })} placeholder="Username" className="font-mono text-sm" />
            </Field>
            <Field label={t("settings.fields.ssPassword.label")}>
              <Input type="password" value={config.ssPassword} onChange={(e) => setConfig({ ssPassword: e.target.value })} placeholder="••••••••" className="font-mono text-sm" />
            </Field>
          </div>
        </div>
      </Section>

      <Section title={t("settings.sections.retroachievements.title")} description={t("settings.sections.retroachievements.description")}>
        <div className="grid sm:grid-cols-2 gap-6">
          <Field label={t("settings.fields.raUsername.label")}>
            <div className="relative">
              <Trophy className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={config.raUsername} onChange={(e) => setConfig({ raUsername: e.target.value })} placeholder="RA Username" className="pl-9 font-mono text-sm" />
            </div>
          </Field>
          <Field label={t("settings.fields.raToken.label")} hint={t("settings.fields.raToken.hint")}>
            <Input type="password" value={config.raToken} onChange={(e) => setConfig({ raToken: e.target.value })} placeholder="RA API Key" className="font-mono text-sm" />
          </Field>
        </div>
      </Section>

      <Section title={t("settings.sections.bulk.title")} description={t("settings.sections.bulk.description")}>
        <div className="p-5 rounded-xl border border-border bg-sidebar/20 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="font-display font-semibold text-sm flex items-center gap-2">
                <Image className="size-4 text-primary" />
                Scrape All ROMs
              </div>
              <div className="text-xs text-muted-foreground">Iterates through all unscraped or failed ROMs and attempts to fetch metadata.</div>
            </div>
            <Button variant="outline" size="sm" onClick={handleBulkScrape} disabled={scraping} className="gap-2">
              {scraping ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              {t("settings.buttons.scrapeAll")}
            </Button>
          </div>
          {progress && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider">
                <span className="text-primary truncate max-w-[200px]">{progress.title || "Processing..."}</span>
                <span className="text-muted-foreground">{progress.current} / {progress.total}</span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} className="h-1.5" />
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
