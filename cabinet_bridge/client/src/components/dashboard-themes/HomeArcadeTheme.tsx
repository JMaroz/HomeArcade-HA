import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { uploadedRomToGame, GAMES, SYSTEMS, type Game, type System, type SystemId } from "@/data/library";
import { GameDetailDialog } from "@/components/GameDetailDialog";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { GameCardSkeleton } from "@/components/GameCardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/lib/queryClient";
import { useIntegration } from "@/lib/integration";
import { useGameDialogState } from "@/lib/useGameDialogState";
import type { UploadedRom, GameCollectionWithItems } from "@shared/schema";
import {
  Play,
  Settings,
  Star,
  Clock,
  Zap,
  Heart,
  Loader2,
  Search,
  ArrowLeft,
  X,
  Sparkles,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useGridNav } from "@/lib/useGridNav";
import Fuse from "fuse.js";
import { FilterBar, type SortOption, type FilterStatus } from "@/components/FilterBar";
import { ConsoleTopBar } from "@/components/ConsoleTopBar";
import { ConsoleSilhouette } from "@/components/ConsoleSilhouette";
import { getSystemBrandTheme } from "@/lib/systemThemes";

// ── WarpScanner ──────────────────────────────────────────────────────────────
export function WarpScanner({
  onScan,
  onClose,
}: {
  onScan: (url: string) => void;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
            aspectRatio: 1.0,
          },
          (text) => {
            if (text.includes("/api/roms/") && text.includes("warp=true")) {
              if (mounted) {
                scanner.stop().then(() => {
                  if (mounted) onScan(text);
                }).catch((e) => console.error("Stop failed", e));
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
        scanner.stop().catch((e) => console.error("Scanner cleanup failed", e));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-sm aspect-square relative rounded-3xl overflow-hidden border-2 border-primary shadow-[0_0_50px_rgba(var(--primary),0.3)] bg-neutral-900">
        <div id="warp-scanner-viewport" className="w-full h-full" />
        {error ? (
          <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-8 text-center">
            <div className="size-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <X className="size-7 text-destructive" />
            </div>
            <div className="text-sm font-bold text-white mb-2">Scanner Error</div>
            <div className="text-[11px] text-white/50 leading-relaxed mb-6">{error}</div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="rounded-xl border-white/10 hover:bg-white/5">Retry</Button>
          </div>
        ) : (
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40" />
        )}
      </div>
      <p className="mt-8 text-white/60 text-xs font-bold uppercase tracking-widest text-center max-w-[240px]">Inquadra il Warp Link QR dal PC per continuare</p>
      <Button onClick={onClose} variant="outline" className="mt-8 w-full max-w-xs h-12 rounded-2xl border-white/10 bg-white/5 font-bold uppercase tracking-widest text-xs">Annulla</Button>
    </div>
  );
}

// ── PlayStatusDot ────────────────────────────────────────────────────────────
function PlayStatusDot({ status }: { status?: string | null }) {
  if (!status || status === "unset") return null;
  const colors: Record<string, string> = {
    playing: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]",
    beaten: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
    completed: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]",
  };
  return <span className={`size-2 rounded-full shrink-0 ${colors[status] || "bg-cyan-400"}`} />;
}

export default function HomeArcadeTheme() {
  const { config } = useIntegration();
  const { t } = useTranslation();

  // Pagination state
  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [totalGames, setTotalGames] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [allRoms, setAllRoms] = useState<UploadedRom[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data: pageData,
    isLoading: isRomsLoading,
    isFetching,
  } = useQuery<{ roms: UploadedRom[]; total: number; hasMore: boolean }>({
    queryKey: ["/api/roms", { limit, offset, excludeChildren: true }],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/roms?limit=${limit}&offset=${offset}&exclude_children=true`));
      if (!res.ok) throw new Error("Failed to fetch roms");
      return res.json();
    },
  });

  // Sync incoming pages
  useEffect(() => {
    if (!pageData) return;
    setAllRoms((prev) => (offset === 0 ? pageData.roms : [...prev, ...pageData.roms]));
    setTotalGames(pageData.total);
    setHasMore(pageData.hasMore);
  }, [pageData, offset]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || isFetching || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOffset((prev) => prev + limit);
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isFetching, limit]);

  const { data: collections = [] } = useQuery<GameCollectionWithItems[]>({ queryKey: ["/api/collections"] });

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

  // ── View & Filtering State ─────────────────────────────────────────────────
  const [view, setView] = useState<"portals" | "system">("portals");
  const [activeSystemId, setActiveSystemId] = useState<SystemId | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const stored = localStorage.getItem("cabinet_sort");
    return (stored as SortOption) || "title";
  });
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(() => {
    const stored = localStorage.getItem("cabinet_filter_status");
    return (stored as FilterStatus) || "all";
  });

  useEffect(() => { localStorage.setItem("cabinet_sort", sortBy); }, [sortBy]);
  useEffect(() => { localStorage.setItem("cabinet_filter_status", filterStatus); }, [filterStatus]);

  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  // Combine uploaded ROMs with default catalog
  const allGames = useMemo(() => {
    const uploaded = allRoms.map(uploadedRomToGame);
    return [...uploaded, ...GAMES];
  }, [allRoms]);

  const systemsWithGames = useMemo(() => {
    return SYSTEMS.filter((s) => allGames.some((g) => g.system === s.id));
  }, [allGames]);

  // Hero spotlight game: most recently played or first available
  const spotlightGame = useMemo(() => {
    const played = allGames.filter((g) => (g.lastPlayed ?? 0) > 0).sort((a, b) => (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0));
    return played[0] || allGames[0] || null;
  }, [allGames]);

  // Favorite games
  const favoriteGames = useMemo(() => {
    return allGames.filter((g) => g.favorite);
  }, [allGames]);

  // Filtered games based on system portal or search
  const filteredGames = useMemo(() => {
    let list = allGames;

    if (activeSystemId) {
      list = list.filter((g) => g.system === activeSystemId);
    }

    if (searchQuery.trim()) {
      const fuse = new Fuse(list, {
        keys: ["title", "system", "genre", "developer", "publisher"],
        threshold: 0.35,
        distance: 100,
      });
      list = fuse.search(searchQuery.trim()).map((r) => r.item);
    }

    if (filterStatus !== "all") {
      list = list.filter((g) => {
        const status = (g as any).playStatus ?? "unset";
        return status === filterStatus;
      });
    }

    const effectiveSort = searchQuery || filterStatus !== "all" ? sortBy : activeSystemId ? "title" : "lastPlayed";

    return [...list].sort((a, b) => {
      switch (effectiveSort) {
        case "title": return a.title.localeCompare(b.title);
        case "year": return (a.year || 0) - (b.year || 0);
        case "rating": return (b.rating || 0) - (a.rating || 0);
        case "playCount": return (b.minutesPlayed ?? 0) - (a.minutesPlayed ?? 0);
        case "lastPlayed":
        default: return (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0);
      }
    });
  }, [allGames, activeSystemId, searchQuery, sortBy, filterStatus]);

  const activeGame = filteredGames[activeGameIdx];

  // Grid Navigation for Controller / Keyboard
  const gridRef = useRef<HTMLDivElement>(null);
  const { focusedIndex, setFocusedIndex } = useGridNav({
    count: view === "system" || searchQuery ? filteredGames.length : systemsWithGames.length,
    gridRef,
    disabled: !!dialogGame,
    mapping: config.uiGamepadMapping,
    onActivate: (idx) => {
      if (view === "portals" && !searchQuery) {
        const sys = systemsWithGames[idx];
        if (sys) enterPortal(sys.id);
      } else {
        const game = filteredGames[idx];
        if (game) openGame(game);
      }
    },
    onFocusChange: (idx) => {
      if (idx >= 0 && (view === "system" || searchQuery)) setActiveGameIdx(idx);
    },
    onFav: () => {
      if (activeGame) handleToggleFav(activeGame);
    },
  });

  useEffect(() => {
    if (activeGameIdx !== focusedIndex) setFocusedIndex(activeGameIdx);
  }, [activeGameIdx, focusedIndex, setFocusedIndex]);

  // System portal click handler
  const enterPortal = (sysId: SystemId) => {
    setActiveSystemId(sysId);
    setView("system");
    setSearchQuery("");
    setActiveGameIdx(0);
    setFocusedIndex(0);
  };

  const backToPortals = () => {
    setView("portals");
    setActiveSystemId(null);
    setSearchQuery("");
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // System brand theme for active system
  const activeBrand = getSystemBrandTheme(activeSystemId);

  return (
    <div
      data-system={activeSystemId || undefined}
      className="flex-1 flex flex-col min-h-0 bg-[#08080d] text-white select-none overflow-hidden font-sans relative transition-colors duration-500"
    >
      {/* ── TOP CONSOLE NAVIGATION BAR ─────────────────────────────────── */}
      <ConsoleTopBar
        activeSystemId={activeSystemId}
        onResetSystem={backToPortals}
        onSearchClick={() => searchRef.current?.focus()}
      />

      {/* ── AMBIENT FANART BACKGROUND ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {(view === "system" || searchQuery) && activeGame && (
          <motion.div
            key={activeGame.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            {activeGame.artUrl ? (
              <img
                src={apiUrl(activeGame.romId ? `/api/roms/${activeGame.romId}/art` : `/api/art?url=${encodeURIComponent(activeGame.artUrl)}`)}
                className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
                alt=""
              />
            ) : (
              <div
                className="w-full h-full opacity-10"
                style={{
                  background: `radial-gradient(circle at center, ${activeBrand.accentDotColor}, #08080d 80%)`,
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080d] via-transparent to-[#08080d]/90" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        
        {/* ── HEADER / SEARCH & SYSTEM BAR ──────────────────────────────── */}
        <header className="shrink-0 px-6 pt-5 pb-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {view === "system" && !searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={backToPortals}
                  className="rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                  title="Torna a tutti i sistemi"
                >
                  <ArrowLeft className="size-5" />
                </Button>
              )}
              <h1 className="font-display text-2xl font-black tracking-tight flex items-center gap-2">
                {searchQuery ? "Risultati Ricerca" : view === "system" ? activeBrand.brandLabel : "Libreria Giochi"}
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] ml-2">
                  {filteredGames.length}{totalGames > 0 ? ` / ${totalGames}` : ""} Titoli
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group hidden sm:block">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors" />
                <Input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca titoli (Cmd+K)..."
                  className="w-48 md:w-64 h-9 pl-9 bg-white/5 border-white/10 rounded-full text-xs font-medium focus:ring-primary/40 focus:border-primary/40 group-hover:bg-white/10 transition-all text-white placeholder-white/30"
                />
              </div>
            </div>
          </div>

          {/* Filter & Sort Bar (shown in system drill-down or search) */}
          {(view === "system" || searchQuery) && (
            <FilterBar
              sortBy={sortBy}
              onSortChange={setSortBy}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              totalGames={filteredGames.length}
            />
          )}
        </header>

        {/* ── SCROLLABLE MAIN CONTENT ───────────────────────────────────── */}
        <main ref={gridRef} className="flex-1 overflow-y-auto px-6 pb-24 scrollbar-none overscroll-contain space-y-8">
          <AnimatePresence mode="wait">
            
            {/* ── 1. PORTALS VIEW (Console Launcher Landing) ──────────── */}
            {view === "portals" && !searchQuery && (
              <motion.div
                key="portals-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* ── HERO BANNER: CONTINUA A GIOCARE ──────────────────── */}
                {spotlightGame && (
                  <section className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 p-6 md:p-8 transition-all hover:border-white/20 shadow-2xl group">
                    <div className="absolute -right-20 -top-20 size-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -left-20 -bottom-20 size-80 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-mono text-[10px] font-extrabold uppercase tracking-widest border border-primary/30">
                            {spotlightGame.lastPlayed ? "CONTINUA A GIOCARE" : "IN EVIDENZA"}
                          </span>
                          <span className="text-xs text-white/50 font-mono uppercase">
                            {SYSTEMS.find((s) => s.id === spotlightGame.system)?.shortName}
                            {spotlightGame.year > 0 && ` • ${spotlightGame.year}`}
                          </span>
                        </div>

                        <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white drop-shadow-md">
                          {spotlightGame.title}
                        </h2>

                        {spotlightGame.description && (
                          <p className="text-xs sm:text-sm text-white/70 max-w-xl leading-relaxed line-clamp-2">
                            {spotlightGame.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs font-mono text-white/50 pt-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-accent" />
                            <span>Tempo giocato: <strong className="text-white">{spotlightGame.minutesPlayed ? `${Math.floor(spotlightGame.minutesPlayed / 60)}h ${spotlightGame.minutesPlayed % 60}m` : "0m"}</strong></span>
                          </div>
                          {spotlightGame.playStatus && (
                            <div>Stato: <span className="text-emerald-400 font-bold capitalize">{spotlightGame.playStatus}</span></div>
                          )}
                        </div>
                      </div>

                      {/* Snapshot & Play Action */}
                      <div className="flex items-center gap-4 shrink-0 bg-white/[0.03] p-3.5 rounded-2xl border border-white/5">
                        {spotlightGame.romId && (
                          <div
                            onClick={() => openGame(spotlightGame)}
                            className="w-36 aspect-video rounded-xl overflow-hidden border border-white/10 shadow-md relative bg-neutral-900 cursor-pointer hover:scale-105 transition-transform"
                            title="Visualizza dettagli e salvataggi"
                          >
                            <img
                              src={apiUrl(`/api/roms/${spotlightGame.romId}/save-thumb/auto?t=${spotlightGame.lastPlayed}`)}
                              alt=""
                              onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                              <span className="text-[9px] font-mono text-white/80">Snapshot recente</span>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => openGame(spotlightGame)}
                          className="px-7 py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-extrabold text-xs uppercase tracking-wider shadow-xl glow-primary hover:scale-105 transition-all flex items-center gap-2.5 focus:outline-none"
                        >
                          <Play className="size-4 fill-current" />
                          <span>RIPRENDI ORA</span>
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {/* ── PORTALI SISTEMI (CLICK TO TRIGGER DYNAMIC THEME) ─── */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-white/70 flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      <span>PORTALI SISTEMI ({systemsWithGames.length})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {systemsWithGames.map((system) => {
                      const count = allGames.filter((g) => g.system === system.id).length;
                      const brand = getSystemBrandTheme(system.id);
                      return (
                        <motion.button
                          key={system.id}
                          whileHover={{ scale: 1.03, y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => enterPortal(system.id)}
                          className="group relative aspect-[16/11] rounded-3xl overflow-hidden glass-panel border border-white/10 text-left transition-all hover:border-white/30 hover:shadow-2xl focus:outline-none"
                          style={{
                            background: `linear-gradient(135deg, hsl(${system.art[0]} / 0.8) 0%, hsl(${system.art[1]} / 0.8) 100%)`,
                          }}
                        >
                          {/* Console Silhouette watermark */}
                          <div className="absolute inset-0 opacity-40 group-hover:opacity-75 group-hover:scale-110 transition-all duration-500 pointer-events-none">
                            <ConsoleSilhouette systemId={system.id} />
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                          <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                            <div className="font-mono text-[10px] text-white/60 tracking-[0.2em] font-bold">
                              {system.mono || system.shortName}
                            </div>
                            <div>
                              <div className="font-display text-lg font-black uppercase leading-tight text-white drop-shadow-md">
                                {system.shortName}
                              </div>
                              <div className="text-[10px] font-mono text-white/70 uppercase tracking-widest mt-1 font-bold">
                                {count} Titoli &rarr;
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                {/* ── PREFERITI (FAVORITES CAROUSEL) ───────────────────── */}
                {favoriteGames.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-white/70 flex items-center gap-2">
                        <Heart className="size-4 text-red-400 fill-current" />
                        <span>PREFERITI ({favoriteGames.length})</span>
                      </h3>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                      {favoriteGames.slice(0, 12).map((game) => (
                        <div
                          key={game.id}
                          onClick={() => openGame(game)}
                          className="w-32 sm:w-40 aspect-[2/3] rounded-2xl overflow-hidden glass-panel border border-white/10 shrink-0 hover:scale-105 transition-all cursor-pointer shadow-lg relative group"
                        >
                          {game.artUrl ? (
                            <img
                              src={apiUrl(game.romId ? `/api/roms/${game.romId}/art` : `/api/art?url=${encodeURIComponent(game.artUrl)}`)}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-900 flex items-center justify-center p-2 text-center text-xs font-bold text-white/40">
                              {game.title}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-2.5 flex flex-col justify-end">
                            <span className="font-bold text-xs text-white leading-tight line-clamp-1">{game.title}</span>
                            <span className="text-[9px] font-mono text-white/50 uppercase">{SYSTEMS.find((s) => s.id === game.system)?.shortName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </motion.div>
            )}

            {/* ── 2. GAME GRID VIEW (System Drill-Down or Search) ─────── */}
            {(view === "system" || searchQuery) && (
              <motion.div
                key="grid-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
              >
                {isRomsLoading ? (
                  <GameCardSkeleton count={18} />
                ) : filteredGames.length === 0 ? (
                  <div className="col-span-full h-64 flex flex-col items-center justify-center text-white/30">
                    <Search className="size-12 mb-4 opacity-50" />
                    <div className="font-display text-sm font-black uppercase tracking-widest">Nessun gioco corrispondente</div>
                    <Button variant="ghost" onClick={() => setSearchQuery("")} className="mt-4 text-xs font-mono">Resetta Ricerca</Button>
                  </div>
                ) : (
                  filteredGames.map((game, i) => {
                    const isActive = i === activeGameIdx;
                    return (
                      <motion.div
                        key={game.id}
                        data-testid={`card-game-${game.id}`}
                        animate={{ scale: isActive ? 1.05 : 1 }}
                        whileHover={{ scale: 1.05, y: -4 }}
                        onClick={() => openGame(game)}
                        className={`relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                          isActive
                            ? "ring-2 ring-primary shadow-[0_0_30px_rgba(var(--primary),0.35)] z-10"
                            : "ring-1 ring-white/10 hover:ring-primary/40 hover:shadow-xl"
                        }`}
                      >
                        {/* Cover Art */}
                        <div className="absolute inset-0 bg-neutral-900/60 flex items-center justify-center">
                          {game.artUrl ? (
                            <img
                              src={apiUrl(game.romId ? `/api/roms/${game.romId}/art` : `/api/art?url=${encodeURIComponent(game.artUrl)}`)}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          ) : (
                            <span className="text-[11px] font-black uppercase text-white/30 px-3 text-center leading-tight">
                              {game.title}
                            </span>
                          )}
                        </div>

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                          <PlayStatusDot status={game.playStatus} />
                          {game.isMultiDisc && (
                            <span className="px-1.5 py-0.5 rounded-md font-mono text-[8px] font-bold uppercase bg-black/60 text-white/90 border border-white/20">
                              M3U
                            </span>
                          )}
                        </div>

                        {/* Favorite Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFav(game);
                          }}
                          className={`absolute top-2 right-2 size-7 rounded-full flex items-center justify-center transition-all z-10 ${
                            game.favorite
                              ? "bg-red-500/80 text-white shadow-md"
                              : "bg-black/50 text-white/50 opacity-0 group-hover:opacity-100 hover:text-white"
                          }`}
                        >
                          <Heart className={`size-3.5 ${game.favorite ? "fill-current" : ""}`} />
                        </button>

                        {/* Bottom Overlay Title */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-85 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                          <div className="font-bold text-xs text-white leading-tight line-clamp-1">{game.title}</div>
                          <div className="text-[10px] font-mono text-white/50 uppercase mt-0.5 flex items-center justify-between">
                            <span>{SYSTEMS.find((s) => s.id === game.system)?.shortName}</span>
                            {game.year > 0 && <span>{game.year}</span>}
                          </div>
                        </div>

                        {/* Focus Pulse Ring */}
                        {isActive && (
                          <motion.div
                            animate={{ opacity: [0.2, 0.5, 0.2] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 ring-2 ring-primary rounded-2xl pointer-events-none"
                          />
                        )}
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}

            {/* Infinite scroll sentinel + counter */}
            {(view === "system" || searchQuery) && (
              <div className="flex flex-col items-center pt-8 pb-4">
                {isFetching && (
                  <div className="flex items-center gap-2 mb-3">
                    <Loader2 className="size-4 animate-spin text-white/40" />
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Caricamento altri titoli…</span>
                  </div>
                )}
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                  Visualizzati {filteredGames.length} di {totalGames || filteredGames.length} titoli
                </span>
                {hasMore && <div ref={sentinelRef} className="h-4 w-full" />}
              </div>
            )}
          </AnimatePresence>

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
        </main>
      </div>

      <WelcomeDialog hasRoms={allRoms.length > 0} />
    </div>
  );
}
