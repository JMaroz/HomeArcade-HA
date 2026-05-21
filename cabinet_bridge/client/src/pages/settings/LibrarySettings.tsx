/**
 * LibrarySettings — ROM Management tab content for Settings page.
 * Covers scanner status, manual uploads, and smart filter collections.
 */
import React, { useState } from "react";
import { useIntegration } from "@/lib/integration";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sparkles, ScanLine, Loader2 } from "lucide-react";
import { RomUpload } from "@/components/RomUpload";
import { Section } from "./SettingsShared";
import type { SmartFilterRules } from "@shared/schema";

interface ScannerStatusData {
  enabled: boolean;
  watchDir: string | null;
  lastScanAt: number | null;
  lastScanFound: number;
  totalScanned: number;
  watching: boolean;
  error: string | null;
}

const ALL_SYSTEMS = [
  { id: "nes", label: "NES" }, { id: "snes", label: "SNES" },
  { id: "genesis", label: "Genesis" }, { id: "n64", label: "N64" },
  { id: "gb", label: "GB" }, { id: "gbc", label: "GBC" },
  { id: "gba", label: "GBA" }, { id: "nds", label: "NDS" },
  { id: "ps1", label: "PS1" }, { id: "ps2", label: "PS2" },
  { id: "psp", label: "PSP" }, { id: "dreamcast", label: "DC" },
  { id: "arcade", label: "Arcade" },
];

const ALL_STATUSES = [
  { id: "unset", label: "Unset" }, { id: "playing", label: "Playing" },
  { id: "beaten", label: "Beaten" }, { id: "completed", label: "Completed" },
];

function ScannerStatusSection() {
  const { t } = useTranslation();
  const { config, setConfig } = useIntegration();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const { data: status } = useQuery<ScannerStatusData>({ queryKey: ["/api/scanner/status"], refetchInterval: 30_000 });

  const handleScanNow = async () => {
    setScanning(true);
    try {
      await apiRequest("POST", "/api/scanner/scan-now");
      await queryClient.invalidateQueries({ queryKey: ["/api/scanner/status"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/roms"] });
      toast({ title: "Scan complete", description: `Found ${status?.lastScanFound ?? 0} new ROM(s).` });
    } catch (err) {
      toast({ title: "Scan failed", description: String(err), variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  return (
    <Section title={t("settings.sections.scanner.title")} description={t("settings.sections.scanner.enabledDescription")}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Watch Directories</Label>
          <div className="flex gap-2">
            <Input
              value={config.libraryWatchPaths}
              onChange={(e) => setConfig({ libraryWatchPaths: e.target.value })}
              placeholder="e.g. C:\RetroBat\roms, /mnt/roms"
              className="font-mono text-sm"
            />
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Separate multiple paths with commas. These folders will be scanned automatically every 60 seconds.
            You can also set <code className="bg-muted px-1 rounded text-[9px]">CABINET_ROM_WATCH_DIR</code> in your environment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div className="flex-1 min-w-[200px] space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status</span>
              {status?.watching ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                   {t("common.ui.active")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-full border border-white/5">
                   Idle
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground font-mono">
              <span>Total: <span className="text-foreground">{status?.totalScanned ?? 0}</span></span>
              {status?.lastScanAt ? <span>Last run: <span className="text-foreground">{new Date(status.lastScanAt).toLocaleTimeString()}</span></span> : null}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleScanNow} 
            disabled={scanning} 
            className="gap-1.5 h-9 px-4 font-black uppercase tracking-wider text-[10px] bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary"
          >
            {scanning ? <Loader2 className="size-3.5 animate-spin" /> : <ScanLine className="size-3.5" />}
            {t("settings.buttons.scanNow")}
          </Button>
        </div>

        {status?.error && <p className="text-xs text-destructive font-mono bg-destructive/10 p-3 rounded-lg border border-destructive/20">{status.error}</p>}
      </div>
    </Section>
  );
}

function SmartFilterCollectionCreator() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [systems, setSystems] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [minMinutes, setMinMinutes] = useState<number>(0);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [genre, setGenre] = useState("");
  const [saving, setSaving] = useState(false);

  const toggle = <T,>(arr: T[], val: T): T[] => arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const handleCreate = async () => {
    if (!name.trim()) return;
    const rules: SmartFilterRules = {};
    if (systems.length) rules.systems = systems;
    if (statuses.length) rules.playStatus = statuses;
    if (minRating > 0) rules.minRating = minRating;
    if (minMinutes > 0) rules.minMinutesPlayed = minMinutes;
    if (favoritesOnly) rules.favorites = true;
    if (genre.trim()) rules.genre = genre.trim();
    setSaving(true);
    try {
      const res = await apiRequest("POST", "/api/collections/smart", { name: name.trim(), rules });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? "Error");
      await queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({ title: "Smart filter created", description: `"${name.trim()}" will update automatically.` });
      setOpen(false);
      setName(""); setSystems([]); setStatuses([]);
      setMinRating(0); setMinMinutes(0); setFavoritesOnly(false); setGenre("");
    } catch (err) {
      toast({ title: "Failed to create", description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title={t("settings.sections.smartFilters.title")} description={t("settings.sections.smartFilters.description")}>
      {!open ? (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5" data-testid="button-create-smart-filter">
          <Sparkles className="size-3.5" /> {t("settings.buttons.create")}
        </Button>
      ) : (
        <div className="rounded-xl border border-border bg-black/30 p-4 space-y-4">
          <div className="space-y-1">
            <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{t("home.prompts.collectionName")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Currently Playing" data-testid="input-smart-filter-name" className="font-mono text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{t("nav.browseSystems")} <span className="opacity-50">(empty = all)</span></Label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SYSTEMS.map(({ id, label }) => (
                <button key={id} type="button" onClick={() => setSystems((s) => toggle(s, id))}
                  className={`px-2.5 py-1 rounded-full border font-mono text-[10px] uppercase tracking-wider transition-all ${systems.includes(id) ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{t("history.stats.playStatus")} <span className="opacity-50">(empty = any)</span></Label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_STATUSES.map(({ id, label }) => (
                <button key={id} type="button" onClick={() => setStatuses((s) => toggle(s, id))}
                  className={`px-2.5 py-1 rounded-full border font-mono text-[10px] uppercase tracking-wider transition-all ${statuses.includes(id) ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Min rating (0 = any)</Label>
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full h-9 rounded-md border border-border bg-background/50 px-2 font-mono text-xs text-foreground" data-testid="select-smart-filter-min-rating">
                <option value={0}>Any</option>
                {[1,2,3,4,5].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Min playtime</Label>
              <select value={minMinutes} onChange={(e) => setMinMinutes(Number(e.target.value))}
                className="w-full h-9 rounded-md border border-border bg-background/50 px-2 font-mono text-xs text-foreground">
                <option value={0}>Any</option>
                <option value={10}>10 min</option>
                <option value={60}>1 hour</option>
                <option value={300}>5 hours</option>
                <option value={1200}>20 hours</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Genre contains</Label>
              <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g. RPG" className="font-mono text-xs" data-testid="input-smart-filter-genre" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch id="sf-favorites" checked={favoritesOnly} onCheckedChange={setFavoritesOnly} />
              <Label htmlFor="sf-favorites" className="text-sm">Favorites only</Label>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button onClick={handleCreate} disabled={!name.trim() || saving} className="gap-1.5" data-testid="button-save-smart-filter">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {t("settings.buttons.create")}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>{t("settings.buttons.cancel")}</Button>
          </div>
        </div>
      )}
    </Section>
  );
}

export function LibrarySettings() {
  const { t } = useTranslation();
  return (
    <div className="space-y-10">
      <ScannerStatusSection />
      <Separator className="bg-border/60" />
      <Section title={t("settings.sections.manualUpload.title")} description={t("settings.sections.manualUpload.description")}>
        <div className="p-4 rounded-xl border border-border bg-sidebar/20">
          <RomUpload system={undefined} variant="inline" />
        </div>
      </Section>
      <Separator className="bg-border/60" />
      <SmartFilterCollectionCreator />
    </div>
  );
}
