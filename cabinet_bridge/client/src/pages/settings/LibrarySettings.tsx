/**
 * LibrarySettings — ROM Management tab content for Settings page.
 * Covers scanner status, manual uploads, and smart filter collections.
 */
import React, { useState, useRef, useEffect } from "react";
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
import { Sparkles, ScanLine, Loader2, FolderOpen, ImageIcon, RefreshCw, ChevronLeft, HardDrive, Plus } from "lucide-react";
import { RomUpload } from "@/components/RomUpload";
import { Section } from "./SettingsShared";
import { Trash2 } from "lucide-react";
import type { SmartFilterRules } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiUrl } from "@/lib/queryClient";

interface ScannerStatusData {
  enabled: boolean;
  watchDir: string | null;
  watchPaths: string[];
  lastScanAt: number | null;
  lastScanFound: number;
  totalScanned: number;
  watching: boolean;
  error: string | null;
  pathStats?: Record<string, { found: number; imported: number; lastScanAt: number | null; error: string | null }>;
}

interface DirectoryEntry {
  name: string;
  path: string;
  readable: boolean;
}

interface DirectoryRoot {
  id: string;
  label: string;
  path: string;
  available: boolean;
}

interface DirectoryBrowseResponse {
  currentPath: string;
  parentPath: string | null;
  roots: DirectoryRoot[];
  directories: DirectoryEntry[];
}

function splitWatchPaths(value: string | undefined): string[] {
  return (value ?? "").split(",").map((p) => p.trim()).filter(Boolean);
}

function DirectoryPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (path: string) => void;
}) {
  const { toast } = useToast();
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [browseData, setBrowseData] = useState<DirectoryBrowseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCurrentPath(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = currentPath ? `?path=${encodeURIComponent(currentPath)}` : "";
    fetch(apiUrl(`/api/filesystem/directories${params}`))
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? res.statusText);
        return res.json() as Promise<DirectoryBrowseResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setBrowseData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        toast({ title: "Unable to browse folders", description: message, variant: "destructive" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentPath, open, toast]);

  const roots = browseData?.roots ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-[#0c0c0c] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
            <FolderOpen className="size-5 text-accent" />
            Choose ROM directory
          </DialogTitle>
          <DialogDescription className="text-white/45">
            Browse paths visible inside the HomeArcade add-on. External drives are usually under <code>/media</code> or <code>/mnt</code>. Mounted partitions are auto-detected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {roots.map((root) => (
              <Button
                key={root.id}
                type="button"
                variant={browseData?.currentPath === root.path ? "default" : "outline"}
                size="sm"
                disabled={!root.available || loading}
                onClick={() => setCurrentPath(root.path)}
                className="gap-1.5 text-[10px] font-black uppercase tracking-wider"
                title={root.path}
              >
                <HardDrive className="size-3.5" />
                {root.label}
              </Button>
            ))}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current directory</p>
                <p className="truncate font-mono text-xs text-foreground" title={browseData?.currentPath}>
                  {browseData?.currentPath ?? "Loading..."}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!browseData?.parentPath || loading}
                  onClick={() => browseData?.parentPath && setCurrentPath(browseData.parentPath)}
                  className="gap-1.5"
                >
                  <ChevronLeft className="size-3.5" />
                  Up
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!browseData?.currentPath}
                  onClick={() => {
                    if (!browseData?.currentPath) return;
                    onSelect(browseData.currentPath);
                    onOpenChange(false);
                  }}
                  className="gap-1.5"
                >
                  <Plus className="size-3.5" />
                  Use this
                </Button>
              </div>
            </div>

            <ScrollArea className="h-72">
              <div className="space-y-1 p-2">
                {loading ? (
                  <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Loading directories...
                  </div>
                ) : error ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>
                ) : browseData?.directories.length ? (
                  browseData.directories.map((entry) => (
                    <button
                      key={entry.path}
                      type="button"
                      disabled={!entry.readable}
                      onClick={() => setCurrentPath(entry.path)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-mono text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      title={entry.path}
                    >
                      <FolderOpen className="size-4 shrink-0 text-accent" />
                      <span className="truncate">{entry.name}</span>
                      {!entry.readable && <span className="ml-auto text-[9px] uppercase tracking-widest text-destructive">Unreadable</span>}
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col h-40 items-center justify-center gap-2 px-6 text-center text-xs text-muted-foreground">
  <FolderOpen className="size-6 opacity-40" />
  <span>No subdirectories found.</span>
  <span className="leading-relaxed text-muted-foreground/60">Mount external storage in <span className="font-semibold text-foreground/70">Settings → System → Storage</span> in Home Assistant, then refresh. Check <code className="bg-white/5 px-1 rounded text-[9px]">/media</code>, <code className="bg-white/5 px-1 rounded text-[9px]">/mnt</code>, or the <strong>Mounted</strong> root buttons above.</span>
</div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
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
  const [clearing, setClearing] = useState(false);
  const [refreshingArt, setRefreshingArt] = useState(false);
  const [directoryPickerOpen, setDirectoryPickerOpen] = useState(false);
  const [artProgress, setArtProgress] = useState<{ current: number; total: number; title: string } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { data: status } = useQuery<ScannerStatusData>({ queryKey: ["/api/scanner/status"], refetchInterval: 30_000 });
  const { data: debugInfo } = useQuery<{ romRoot: string }>({ queryKey: ["/api/debug"], refetchInterval: false });

  const handleClearLibrary = async () => {
    if (!confirm("This will permanently delete all ROMs and their files from the directory. Are you sure?")) return;
    setClearing(true);
    try {
      const res = await apiRequest("DELETE", "/api/roms");
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? "Error");
      const data = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["/api/roms"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/scanner/status"] });
      toast({ title: "Library cleared", description: `${data.romsRemoved} ROM(s) removed (${data.filesRemoved} files deleted, ${data.filesFailed} files failed).` });
    } catch (err) {
      toast({ title: "Failed to clear library", description: String(err), variant: "destructive" });
    } finally {
      setClearing(false);
    }
  };

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const handleRefreshArt = () => {
    if (refreshingArt) return;
    setRefreshingArt(true);
    setArtProgress(null);

    const es = new EventSource("/api/roms/scrape-all");
    eventSourceRef.current = es;
    let succeeded = 0;
    let failed = 0;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "start") {
          setArtProgress({ current: 0, total: data.total, title: "" });
        } else if (data.type === "progress") {
          setArtProgress({ current: data.current, total: data.total, title: data.title });
        } else if (data.type === "result") {
          if (data.status === "success") succeeded++;
          else failed++;
        } else if (data.type === "complete") {
          es.close();
          eventSourceRef.current = null;
          setRefreshingArt(false);
          setArtProgress(null);
          toast({
            title: "Art refresh complete!",
            description: `${succeeded} succeeded, ${failed} failed.`,
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      setRefreshingArt(false);
      setArtProgress(null);
      toast({ title: "Art refresh error", description: "Connection lost during scrape.", variant: "destructive" });
    };
  };

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

  const addWatchPath = (path: string) => {
    const nextPaths = Array.from(new Set([...splitWatchPaths(config.libraryWatchPaths), path]));
    setConfig({ libraryWatchPaths: nextPaths.join(", ") });
    toast({ title: "ROM directory added", description: `${path} will be scanned automatically.` });
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
              placeholder="e.g. /media/usb-drive/roms, /media/roms, /data/rom-storage"
              className="font-mono text-sm"
            />
            <Button type="button" variant="outline" onClick={() => setDirectoryPickerOpen(true)} className="gap-1.5">
              <FolderOpen className="size-4" />
              Browse
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Separate multiple paths with commas. These folders will be scanned automatically every 60 seconds.
            In Home Assistant add-ons, external drives mapped as media are usually visible as <code className="bg-muted px-1 rounded text-[9px]">/media/...</code>.
            You can also set <code className="bg-muted px-1 rounded text-[9px]">CABINET_ROM_WATCH_DIR</code> in your environment.
          </p>
          <DirectoryPickerDialog open={directoryPickerOpen} onOpenChange={setDirectoryPickerOpen} onSelect={addWatchPath} />
          {debugInfo?.romRoot && (
            <a
              href={`${window.location.origin}/#${debugInfo.romRoot}`}
              className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-accent hover:text-accent/80 transition-colors"
              title={debugInfo.romRoot}
            >
              <FolderOpen className="size-3" />
              ROM Storage: {debugInfo.romRoot}
            </a>
          )}
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

          {artProgress && (
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-accent">
              <RefreshCw className="size-3 animate-spin" />
              Scraping {artProgress.current}/{artProgress.total}: {artProgress.title}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshArt}
            disabled={scanning || refreshingArt}
            className="gap-1.5 h-9 px-4 font-black uppercase tracking-wider text-[10px] bg-accent/10 border-accent/20 hover:bg-accent/20 text-accent"
            title="Refresh all ROM artwork"
          >
            {refreshingArt ? <Loader2 className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />}
            Refresh All Art
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleScanNow}
            disabled={scanning || refreshingArt}
            className="gap-1.5 h-9 px-4 font-black uppercase tracking-wider text-[10px] bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary"
          >
            {scanning ? <Loader2 className="size-3.5 animate-spin" /> : <ScanLine className="size-3.5" />}
            {t("settings.buttons.scanNow")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearLibrary}
            disabled={clearing || refreshingArt}
            className="gap-1.5 h-9 px-4 font-black uppercase tracking-wider text-[10px] text-destructive/80 border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
          >
            {clearing ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            Clear All
          </Button>
        </div>

        {status?.error && <p className="text-xs text-destructive font-mono bg-destructive/10 p-3 rounded-lg border border-destructive/20">{status.error}</p>}
        {status?.pathStats && Object.keys(status.pathStats).length > 0 && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Scanner diagnostics</p>
            <div className="space-y-2">
              {Object.entries(status.pathStats).map(([scanPath, stat]) => (
                <div key={scanPath} className="grid gap-1 rounded-lg border border-white/5 bg-background/30 p-3 font-mono text-[10px] text-muted-foreground md:grid-cols-[1fr_auto_auto] md:items-center">
                  <span className="truncate text-foreground" title={scanPath}>{scanPath}</span>
                  <span>{stat.found} ROM(s), {stat.imported} new</span>
                  <span className={stat.error ? "text-destructive" : "text-green-400"}>{stat.error ?? "OK"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
