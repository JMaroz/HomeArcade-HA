/**
 * ServicesSettings — Online Services tab content for Settings page.
 * Covers RetroAchievements, TheGamesDB, ScreenScraper, and bulk scraping.
 */
import React, { useState, useRef, useEffect } from "react";
import { useIntegration } from "@/lib/integration";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { apiUrl, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Image, Loader2, RefreshCw, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { Section, Field } from "./SettingsShared";

interface ScrapeResult {
  id: number;
  title: string;
  status: "success" | "failed";
}

interface ScrapeProgress {
  current: number;
  total: number;
  title?: string;
}

interface ScrapeComplete {
  matched: number;
  failed: number;
  total: number;
}

export function ServicesSettings() {
  const { config, setConfig } = useIntegration();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState<ScrapeProgress | null>(null);
  const [results, setResults] = useState<ScrapeResult[]>([]);
  const [summary, setSummary] = useState<ScrapeComplete | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the result log as new entries arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [results]);

  const handleBulkScrape = async () => {
    if (scraping) return;
    setScraping(true);
    setProgress(null);
    setResults([]);
    setSummary(null);

    try {
      const res = await fetch(apiUrl("/api/roms/scrape-all"), { method: "POST" });
      if (!res.ok) throw new Error(res.statusText);

      const contentType = res.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        toast({
          title: "Bulk Scrape",
          description: data.message || "No ROMs need scraping.",
        });
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Body reader not available");

      const decoder = new TextDecoder();
      let buffer = "";
      let matched = 0;
      let failed = 0;
      let total = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "start") {
              total = data.total;
              setProgress({ current: 0, total: data.total });
            } else if (data.type === "progress") {
              setProgress({ current: data.current, total: data.total, title: data.title });
            } else if (data.type === "result") {
              if (data.status === "success") matched++;
              else failed++;
              setResults((prev) => [...prev, { id: data.id, title: data.title, status: data.status }]);
            } else if (data.type === "complete") {
              setSummary({ matched, failed, total: matched + failed });
              await queryClient.invalidateQueries({ queryKey: ["/api/roms"] });
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Bulk scrape failed",
        description: err instanceof Error ? err.message : "Network error.",
      });
    } finally {
      setScraping(false);
      setProgress(null);
    }
  };

  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;
  const isActive = scraping || summary !== null;

  return (
    <div className="space-y-10">
      {/* ── Scraper credentials ─────────────────────────────────────────── */}
      <Section title={t("settings.sections.scrapers.title")} description={t("settings.sections.scrapers.description")}>
        <div className="grid sm:grid-cols-2 gap-6">
          <Field label={t("settings.fields.tgdbApiKey.label")} hint={t("settings.fields.tgdbApiKey.hint")}>
            <Input
              value={config.tgdbApiKey}
              onChange={(e) => setConfig({ tgdbApiKey: e.target.value })}
              placeholder="Your API Key"
              className="font-mono text-sm"
            />
          </Field>
          <div className="grid gap-4">
            <Field label={t("settings.fields.ssUserId.label")}>
              <Input
                value={config.ssUserId}
                onChange={(e) => setConfig({ ssUserId: e.target.value })}
                placeholder="Username"
                className="font-mono text-sm"
              />
            </Field>
            <Field label={t("settings.fields.ssPassword.label")}>
              <Input
                type="password"
                value={config.ssPassword}
                onChange={(e) => setConfig({ ssPassword: e.target.value })}
                placeholder="••••••••"
                className="font-mono text-sm"
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── RetroAchievements ───────────────────────────────────────────── */}
      <Section title={t("settings.sections.retroachievements.title")} description={t("settings.sections.retroachievements.description")}>
        <div className="grid sm:grid-cols-2 gap-6">
          <Field label={t("settings.fields.raUsername.label")}>
            <div className="relative">
              <Trophy className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={config.raUsername}
                onChange={(e) => setConfig({ raUsername: e.target.value })}
                placeholder="RA Username"
                className="pl-9 font-mono text-sm"
              />
            </div>
          </Field>
          <Field label={t("settings.fields.raToken.label")} hint={t("settings.fields.raToken.hint")}>
            <Input
              type="password"
              value={config.raToken}
              onChange={(e) => setConfig({ raToken: e.target.value })}
              placeholder="RA API Key"
              className="font-mono text-sm"
            />
          </Field>
        </div>
      </Section>

      {/* ── Bulk Scrape ─────────────────────────────────────────────────── */}
      <Section title={t("settings.sections.bulk.title")} description={t("settings.sections.bulk.description")}>
        <div className="rounded-xl border border-border bg-sidebar/20 overflow-hidden">

          {/* Header row */}
          <div className="flex items-center justify-between gap-4 p-5">
            <div className="space-y-0.5">
              <div className="font-display font-semibold text-sm flex items-center gap-2">
                <Image className="size-4 text-primary" />
                Scrape All ROMs
              </div>
              <div className="text-xs text-muted-foreground">
                Iterates through all unscraped or failed ROMs and attempts to fetch cover art and metadata.
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkScrape}
              disabled={scraping}
              className="shrink-0 gap-2"
            >
              {scraping
                ? <Loader2 className="size-3.5 animate-spin" />
                : <RefreshCw className="size-3.5" />}
              {scraping ? "Scraping…" : t("settings.buttons.scrapeAll")}
            </Button>
          </div>

          {/* Progress bar — shown while scraping */}
          {scraping && progress && (
            <div className="px-5 pb-4 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-2">
                {/* Pulsing "now scraping" title */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  <span className="font-mono text-[11px] text-primary truncate">
                    {progress.title || "Processing…"}
                  </span>
                </div>
                {/* Percentage + count */}
                <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                  {pct}% &nbsp;·&nbsp; {progress.current} / {progress.total}
                </span>
              </div>
              <Progress value={pct} className="h-2 rounded-full" />
            </div>
          )}

          {/* Result log — shown while scraping or after */}
          {isActive && results.length > 0 && (
            <div
              ref={logRef}
              className="mx-5 mb-5 rounded-lg border border-border bg-background/40 overflow-y-auto max-h-48 text-[11px] font-mono divide-y divide-border/40"
            >
              {results.map((r) => (
                <div
                  key={r.id}
                  className={[
                    "flex items-center gap-2 px-3 py-1.5",
                    r.status === "success" ? "text-foreground" : "text-muted-foreground/60",
                  ].join(" ")}
                >
                  {r.status === "success"
                    ? <CheckCircle2 className="size-3 text-green-500 shrink-0" />
                    : <XCircle className="size-3 text-destructive/60 shrink-0" />}
                  <span className="truncate">{r.title}</span>
                  <span className={["ml-auto shrink-0 uppercase tracking-wider text-[9px]", r.status === "success" ? "text-green-500/70" : "text-destructive/50"].join(" ")}>
                    {r.status === "success" ? "matched" : "no match"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Completion summary */}
          {summary !== null && !scraping && (
            <div className="mx-5 mb-5 rounded-lg border border-border bg-primary/5 px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <Sparkles className="size-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-sm text-foreground">
                  Scrape complete
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  <span className="text-green-500 font-medium">{summary.matched} matched</span>
                  {summary.failed > 0 && (
                    <> · <span className="text-destructive/70">{summary.failed} not found</span></>
                  )}
                  {" "}out of {summary.total} ROM{summary.total !== 1 ? "s" : ""}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs h-7"
                onClick={() => { setResults([]); setSummary(null); }}
              >
                Dismiss
              </Button>
            </div>
          )}

        </div>
      </Section>
    </div>
  );
}
