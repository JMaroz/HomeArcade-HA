import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { uploadedRomToGame, GAMES, SYSTEMS, type Game, type System, type SystemId } from "@/data/library";
import { GameDetailDialog } from "@/components/GameDetailDialog";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { GameCardSkeleton } from "@/components/GameCardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/lib/queryClient";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIntegration } from "@/lib/integration";
import { useGameDialogState } from "@/lib/useGameDialogState";
import type { UploadedRom, GameCollectionWithItems, RomSaveSlot, GameCheatCode } from "@shared/schema";
import {
  Play,
  Settings,
  Star,
  ChevronRight,
  Clock,
  Zap,
  Save,
  Trophy,
  History,
  Folder,
  Plus,
  Loader2,
  ImagePlus,
  Database,
  Check,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Timer,
  Info,
  LayoutGrid,
  Camera,
  QrCode,
  Wifi,
  X,
  ChevronDown,
  ChevronUp,
  Gamepad,
  List,
  Search,
  Upload,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useGridNav } from "@/lib/useGridNav";
import Fuse from "fuse.js";
import { useLocation } from "wouter";
import { WarpLinkDialog } from "@/components/WarpLinkDialog";

// ── sub-components ────────────────────────────────────────────────────────────

function DashboardStatsSection() {
  const { t } = useTranslation();
  const { data: stats } = useQuery<any>({ queryKey: ["/api/stats/summary"], refetchInterval: 60_000 });
  
  if (!stats?.summary || stats.summary.totalGames === 0) return null;

  return (
    <div className="px-4 sm:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Summary Stats */}
      <div className="col-span-1 space-y-4">
        <div className="font-display text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Life Summary</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.03] space-y-1">
            <div className="text-2xl font-black text-primary">{fmtHoursShort(stats.summary.totalMinutes)}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-white/40">Play Time</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.03] space-y-1">
            <div className="text-2xl font-black text-white">{stats.summary.totalGames}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-white/40">Games</div>
          </div>
        </div>
      </div>

      {/* Hall of Fame (Top 3) */}
      <div className="col-span-1 md:col-span-2 space-y-4">
        <div className="font-display text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Hall of Fame</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.hallOfFame?.map((game: any, i: number) => (
            <div key={game.id} className="relative group rounded-2xl border border-white/5 bg-white/[0.03] p-3 flex items-center gap-3 overflow-hidden">
               <div className="absolute -left-2 -top-2 text-4xl font-black italic text-white/[0.03] group-hover:text-primary/10 transition-colors pointer-events-none">#{i+1}</div>
               <div className="relative size-12 rounded-lg overflow-hidden bg-neutral-900 shrink-0 ring-1 ring-white/10">
                 {game.artUrl ? (
                   <img src={apiUrl(game.romId ? `/api/roms/${game.romId}/art` : `/api/art?url=${encodeURIComponent(game.artUrl)}`)} className="size-full object-cover" alt="" />
                 ) : (
                   <div className="size-full flex items-center justify-center text-[8px] font-black text-white/20 uppercase">{game.system}</div>
                 )}
               </div>
               <div className="min-w-0">
                 <div className="text-[11px] font-black uppercase truncate text-white/90">{game.title}</div>
                 <div className="text-[9px] font-mono text-white/40">{fmtHoursShort(game.minutesPlayed || 0)} played</div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SaveSlotCard({
  slot,
  romId,
  onDelete,
}: {
  slot: RomSaveSlot;
  romId: number;
  onDelete: () => void;
}) {
  const [thumbError, setThumbError] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const thumbUrl = `/api/roms/${romId}/save-thumb/${slot.slot}`;

  const timeAgo = (() => {
    const diffMs = Date.now() - slot.updatedAt;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  })();

  return (
    <div className="group relative rounded-2xl border border-white/5 bg-white/5 overflow-hidden w-[100px] shrink-0">
      <div className="relative w-full aspect-video bg-neutral-900 flex items-center justify-center">
        {!thumbError ? (
          <img
            src={thumbUrl}
            alt={`Slot ${slot.slot}`}
            className="w-full h-full object-cover"
            onError={() => setThumbError(true)}
            decoding="async"
          />
        ) : (
          <Save className="size-5 text-white/10" />
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {confirming ? (
            <div className="flex flex-col items-center gap-1">
              <button onClick={onDelete} className="text-[8px] font-black uppercase text-red-400">Delete?</button>
              <button onClick={() => setConfirming(false)} className="text-[8px] font-black uppercase text-white/40">No</button>
            </div>
          ) : (
            <button onClick={() => setConfirming(true)} className="p-2 bg-black/40 rounded-full text-white/60 hover:text-white">
              <Trash2 className="size-3" />
            </button>
          )}
        </div>
      </div>
      <div className="p-2 text-center">
        <div className="font-mono text-[9px] font-bold text-white/80 truncate">{slot.label}</div>
        <div className="font-mono text-[8px] text-white/30 truncate">{timeAgo}</div>
      </div>
    </div>
  );
}

export function WarpScanner({
  onScan,
  onClose
}: {
  onScan: (url: string) => void;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Secure context check (required for getUserMedia)
    if (!window.isSecureContext) {
      setError("Camera access requires a secure context (HTTPS).");
      return;
    }

    const scanner = new Html5Qrcode("warp-scanner-viewport");
    let mounted = true;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 20,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0
          },
          (text) => {
            // Simple check to ensure it's a HomeArcade warp link
            if (text.includes("/api/roms/") && text.includes("warp=true")) {
              if (mounted) {
                scanner.stop().then(() => {
                  if (mounted) onScan(text);
                }).catch(e => console.error("Stop failed", e));
              }
            }
          },
          () => {}
        );
      } catch (err: any) {
        console.error("Scanner failed", err);
        if (mounted) {
          setError(err?.message || "Failed to access camera.");
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scanner.isScanning) {
        scanner.stop().catch(e => console.error("Scanner cleanup failed", e));
      }
    };
  }, []); // Run once on mount, ignore onScan changes to prevent flicker

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-sm aspect-square relative rounded-3xl overflow-hidden border-2 border-primary shadow-[0_0_50px_rgba(var(--primary),0.3)] bg-neutral-900">
        <div id="warp-scanner-viewport" className="w-full h-full" />
        
        {error ? (
          <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-8 text-center">
            <div className="size-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <X className="size-7 text-destructive" />
            </div>
            <div className="text-sm font-bold text-white mb-2">Scanner Error</div>
            <div className="text-[11px] text-white/50 leading-relaxed mb-6">
              {error}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="rounded-xl border-white/10 hover:bg-white/5"
            >
              Retry
            </Button>
          </div>
        ) : (
          /* Subtle scan guide overlay */
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40" />
        )}
      </div>
      
      <p className="mt-8 text-white/60 text-xs font-bold uppercase tracking-widest text-center max-w-[240px]">
        Scan the Warp Link on your PC to continue playing
      </p>
      
      <Button
        onClick={onClose}
        variant="outline"
        className="mt-12 w-full max-w-xs h-14 rounded-2xl border-white/10 bg-white/5 font-black uppercase tracking-widest"
      >
        Cancel Scan
      </Button>
    </div>
  );
}

function CheatRow({
  cheat,
  onToggle,
  onDelete,
}: {
  cheat: GameCheatCode;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
      <button onClick={onToggle} className="shrink-0 text-white/20 hover:text-white transition-colors">
        {cheat.enabled ? <ToggleRight className="size-5 text-primary" /> : <ToggleLeft className="size-5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`font-mono text-[11px] font-bold truncate ${cheat.enabled ? "text-white" : "text-white/20"}`}>
          {cheat.description}
        </div>
        <div className="font-mono text-[9px] text-white/20 truncate tracking-widest uppercase">
          {cheat.code}
        </div>
      </div>
      {confirming ? (
        <div className="flex items-center gap-2">
          <button onClick={onDelete} className="text-[9px] font-black uppercase text-red-400">Yes</button>
          <button onClick={() => setConfirming(false)} className="text-[9px] font-black uppercase text-white/40">No</button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} className="p-2 text-white/10 hover:text-red-400 transition-colors">
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function fmtHoursShort(minutes: number) {
  const h = minutes / 60;
  if (h < 1) return `${minutes}m`;
  return `${h % 1 === 0 ? h : h.toFixed(1)}h`;
}

export default function HomeArcadeTheme() {
  const { config } = useIntegration();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: roms = [], isLoading: isRomsLoading } = useQuery<UploadedRom[]>({ queryKey: ["/api/roms"] });
  const { data: collections = [] } = useQuery<GameCollectionWithItems[]>({
    queryKey: ["/api/collections"],
  });

  const {
    selectedGame: dialogGame,
    openGame,
    closeGame,
    handleToggleFav,
    handleRate,
    handleCreateCollection,
    handleToggleCollection,
    handleSetStatus,
  } = useGameDialogState();

  // â”€â”€ All Games (demo + uploaded) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const allGames = useMemo(() => {
    const uploaded = roms.map(uploadedRomToGame);
    return [...uploaded, ...GAMES];
  }, [roms]);

  // â”€â”€ Search + Sort â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useLocation();
  const [sort, setSort] = useState<"recent" | "title" | "year" | "rating" | "plays">("recent");
  const searchRef = useRef<HTMLInputElement>(null);

  // Derive active filter from location
  const activeFilter = useMemo(() => {
    const loc = location || "/";
    if (loc === "/") return { type: "all" };
    if (loc.startsWith("/library/collection/")) return { type: "collection", value: loc.split("/").pop() };
    if (loc.startsWith("/library/status/")) return { type: "status", value: loc.split("/").pop() };
    if (loc.startsWith("/library/")) return { type: "simple", value: loc.split("/").pop() };
    return { type: "all" };
  }, [location]);

  // Keyboard shortcut: / or Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filteredGames = useMemo(() => {
    let list = allGames;

    // 1. apply routing filter (collections, systems, status)
    if (activeFilter.type === "collection") {
      const col = collections.find(c => String(c.id) === activeFilter.value);
      if (col) {
        if (col.smartFilter) {
          const rules = col.smartFilter;
          list = list.filter(g => {
            if (rules.systems?.length && !rules.systems.includes(g.system)) return false;
            if (rules.playStatus?.length && !rules.playStatus.includes(g.playStatus)) return false;
            if (rules.minRating && (g.rating || 0) < rules.minRating) return false;
            if (rules.minMinutesPlayed && (g.minutesPlayed || 0) < rules.minMinutesPlayed) return false;
            if (rules.favorites && !g.favorite) return false;
            if (rules.genre && !g.genre?.toLowerCase().includes(rules.genre.toLowerCase())) return false;
            return true;
          });
        } else {
          list = list.filter(g => col.romIds.includes(g.romId as number));
        }
      }
    } else if (activeFilter.type === "status") {
      list = list.filter(g => g.playStatus === activeFilter.value);
    } else if (activeFilter.type === "simple") {
      if (activeFilter.value === "favorites") list = list.filter(g => g.favorite);
      else if (activeFilter.value === "recent") list = list.filter(g => g.lastPlayed && g.lastPlayed > 0);
      else if (activeFilter.value === "backlog") list = list.filter(g => g.playStatus === "backlog");
      else if (activeFilter.value === "playing") list = list.filter(g => g.playStatus === "playing");
      else if (activeFilter.value === "completed") list = list.filter(g => g.playStatus === "completed");
      else if (activeFilter.value === "dropped") list = list.filter(g => g.playStatus === "dropped");
      else {
        // Assume system ID if simple value doesn't match
        list = list.filter(g => g.system === activeFilter.value);
      }
    }

    // 2. apply search filter
    const systemFilter = searchQuery.startsWith("filter:") ? searchQuery.slice(7).trim() : "";
    if (systemFilter) {
      list = list.filter((g) => g.system === systemFilter);
    } else if (searchQuery.trim()) {
      const fuse = new Fuse(list, {
        keys: ["title", "system", "genre", "developer", "publisher"],
        threshold: 0.35,
        distance: 100,
      });
      list = fuse.search(searchQuery.trim()).map((r) => r.item);
    }

    return [...list].sort((a, b) => {
      switch (sort) {
        case "title": return a.title.localeCompare(b.title);
        case "year": return (a.year || 0) - (b.year || 0);
        case "rating": return (b.rating || 0) - (a.rating || 0);
        case "plays": return (b.minutesPlayed ?? 0) - (a.minutesPlayed ?? 0);
        case "recent":
        default: return (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0);
      }
    });
  }, [allGames, searchQuery, sort, activeFilter, collections]);

  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const [showScanner, setShowScanner] = useState(false);

  const activeGame = filteredGames[activeGameIdx];

  // â”€â”€ Grid Navigation (Keyboard + Gamepad) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const gridRef = useRef<HTMLDivElement>(null);
  const { focusedIndex, setFocusedIndex } = useGridNav({
    count: filteredGames.length,
    gridRef,
    disabled: !!dialogGame,
    onActivate: (idx) => {
      const game = filteredGames[idx];
      if (game) openGame(game);
    },
    onFav: (idx) => {
      const game = filteredGames[idx];
      if (game) handleToggleFav(game);
    },
    onFocusChange: (idx) => {
      if (idx >= 0) setActiveGameIdx(idx);
    }
  });

  // Sync manual mouse selection back to grid nav focus
  useEffect(() => {
    if (activeGameIdx !== focusedIndex) setFocusedIndex(activeGameIdx);
  }, [activeGameIdx, focusedIndex, setFocusedIndex]);

  // Support ?game=id URL parameter to auto-open dialog
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get("game");
    if (gameId && !dialogGame) {
      const game = allGames.find(g => g.id === gameId);
      if (game) openGame(game);
    }
  }, [location, allGames, dialogGame, openGame]);





  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0c0c0c] text-white select-none overflow-hidden font-sans relative">

      {/* Dynamic Background Fanart (High Blur) */}
      <AnimatePresence mode="wait">
        {activeGame && (
          <motion.div
            key={activeGame.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            {activeGame.artUrl ? (
              <img
                src={apiUrl(activeGame.romId ? `/api/roms/${activeGame.romId}/art` : `/api/art?url=${encodeURIComponent(activeGame.artUrl)}`)}
                className="w-full h-full object-cover opacity-30 blur-[15px] scale-110"
                alt=""
              />
            ) : (
              <div
                className="w-full h-full opacity-20"
                style={{ background: `radial-gradient(circle at center, hsl(${activeGame.art[0]}), #000 80%)` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-transparent to-[#0c0c0c]/90" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scraper credentials nudge — shown when ROMs exist but no scraper key is set */}
      {roms.length > 0 && !config.ssUserId && !config.tgdbApiKey && (
        <div className="shrink-0 z-20 flex items-center justify-between gap-3 px-4 py-2.5 bg-primary/10 border-b border-primary/20">
          <div className="flex items-center gap-2 min-w-0">
            <ImagePlus className="size-3.5 text-primary shrink-0" />
            <span className="text-[11px] font-mono text-white/70 truncate">Add ScreenScraper credentials to fetch box art</span>
          </div>
          <Link href="/settings" className="shrink-0 text-[10px] font-black uppercase tracking-wider text-primary hover:text-primary/80 transition-colors">
            Set up →
          </Link>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 relative z-10">

        {/* Browse Systems — mobile header strip */}
        <div className="shrink-0 border-b border-white/5">
          {/* Systems carousel */}
          <div className="px-4 pt-4 pb-4">
            <div
              className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1 snap-x snap-mandatory flex-nowrap"
              style={{ scrollPaddingLeft: "1rem" }}
            >
              {SYSTEMS.filter((s) => {
                const count = allGames.filter((g) => g.system === s.id).length;
                return count > 0;
              }).map((system) => {
                const count = allGames.filter((g) => g.system === system.id).length;
                return (
                  <button
                    key={system.id}
                    type="button"
                    onClick={() => setSearchQuery("filter:" + system.id)}
                    className={`snap-start shrink-0 w-28 aspect-[4/3] rounded-2xl overflow-hidden border group hover:scale-105 transition-all duration-200 relative system-border-${system.id}`}
                    style={{ background: `linear-gradient(135deg, hsl(${system.art[0]}) 0%, hsl(${system.art[1]}) 100%)` }}
                  >
                    {system.image && (
                      <img
                        src={system.image.url}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover mix-blend-soft-light opacity-80"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <span className="font-black text-4xl text-white">{system.mono}</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-between p-2">
                      <span className="font-black text-xs text-white/60">{system.mono}</span>
                      <div>
                        <div className="font-display text-xs font-black uppercase tracking-wide text-white truncate leading-tight drop-shadow">{system.shortName}</div>
                        <div className="font-mono text-[9px] text-white/40">{count} titles</div>
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity border-2 border-white/30 pointer-events-none" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* All Games Grid — 5-col on mobile portrait, 6-col landscape, scales up on desktop */}
        <div
          ref={gridRef}
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 scrollbar-none overscroll-y-contain pb-24 lg:pb-8"
        >
          {activeFilter.type === "all" && !searchQuery && <DashboardStatsSection />}

          {isRomsLoading ? (
            <GameCardSkeleton count={18} />
          ) : filteredGames.length === 0 && !searchQuery ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-white/30">
              <div className="relative">
                <Gamepad className="size-12" />
                <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Plus className="size-3 text-primary" />
                </div>
              </div>
              <div className="text-center">
                {searchQuery.startsWith("filter:") ? (
                  <>
                    <div className="font-display text-sm font-black uppercase tracking-widest">
                      No {searchQuery.slice(7).toUpperCase()} ROMs yet
                    </div>
                    <div className="text-xs mt-1.5 text-white/20 max-w-[220px]">
                      Upload {searchQuery.slice(7).toUpperCase()} ROM files to see them here
                    </div>
                    <Link href="/settings" className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/30 transition-colors">
                      <Upload className="size-3" /> Upload ROMs
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="font-display text-sm font-black uppercase tracking-widest">No games yet</div>
                    <div className="text-xs mt-1.5 text-white/20 max-w-[200px]">Upload ROMs to get started, or scan a Warp Link to play from your PC</div>
                    <Link href="/settings" className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/30 transition-colors">
                      <Upload className="size-3" /> Upload your first ROM
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-white/30">
              <Search className="size-8 mb-3" />
              <div className="font-display text-sm font-black uppercase tracking-widest">No results</div>
              <div className="text-xs mt-1">Try a different search term or clear the filter</div>
              <button type="button" onClick={() => setSearchQuery("")} className="mt-3 px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-xs font-mono uppercase tracking-wider hover:bg-white/10 transition-colors">Clear filter</button>
            </div>
          ) : (
             <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
                {filteredGames.map((game, i) => {
                  const isActive = i === activeGameIdx;
                  return (
                    <motion.div
                      key={game.id}
                      data-testid={`card-game-${game.id}`}
                      animate={{ scale: isActive ? 1.06 : 1 }}
                      whileHover={{ scale: 1.06, y: -4 }}
                      className={`relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                        isActive
                          ? "ring-2 ring-primary shadow-[0_0_30px_rgba(var(--primary),0.25)] z-10"
                          : "ring-1 ring-white/10 hover:ring-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                      }`}
                      onClick={() => {
                        openGame(game);
                      }}
                    >
                      <div className="absolute inset-0 bg-neutral-900/50 flex items-center justify-center">
                        {game.artUrl ? (
                          <img 
                            src={apiUrl(game.romId ? `/api/roms/${game.romId}/art` : `/api/art?url=${encodeURIComponent(game.artUrl)}`)}
                            className="w-full h-full object-cover" 
                            alt="" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-[10px] font-black uppercase text-white/20 px-2 text-center leading-tight">{game.title}</span>
                        )}
                      </div>

                      {isActive && (
                        <motion.div
                          animate={{ opacity: [0.2, 0.5, 0.2] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute inset-0 ring-2 ring-primary rounded-xl pointer-events-none"
                        />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  );
                })}
             </div>
          )}

          <GameDetailDialog
            game={dialogGame}
            onClose={closeGame}
            onToggleFav={handleToggleFav}
            onRate={handleRate}
            collections={collections}
            onCreateCollection={handleCreateCollection}
            onToggleCollection={handleToggleCollection}
            onSetStatus={handleSetStatus}
          />
        </div>
      </div>


      <WelcomeDialog hasRoms={roms.length > 0} />


      {showScanner && (
        <WarpScanner
          onClose={() => setShowScanner(false)}
          onScan={(url) => {
            setShowScanner(false);
            // Internal redirect to the scanned warp link
            window.location.href = url;
          }}
        />
      )}
    </div>
  );
}
