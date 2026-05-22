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
  ArrowLeft,
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

/**
 * WarpScanner — QR Code scanner for mobile "Warp" play.
 */
export function WarpScanner({
  onScan,
  onClose
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
            aspectRatio: 1.0
          },
          (text) => {
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
  }, []);

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
            <div className="text-[11px] text-white/50 leading-relaxed mb-6">{error}</div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="rounded-xl border-white/10 hover:bg-white/5">Retry</Button>
          </div>
        ) : (
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40" />
        )}
      </div>
      <p className="mt-8 text-white/60 text-xs font-bold uppercase tracking-widest text-center max-w-[240px]">Scan the Warp Link on your PC to continue playing</p>
      <Button onClick={onClose} variant="outline" className="mt-12 w-full max-w-xs h-14 rounded-2xl border-white/10 bg-white/5 font-black uppercase tracking-widest">Cancel Scan</Button>
    </div>
  );
}

export default function HomeArcadeTheme() {
  const { config } = useIntegration();
  const { t } = useTranslation();
  const { data: roms = [], isLoading: isRomsLoading } = useQuery<UploadedRom[]>({ queryKey: ["/api/roms"] });
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

  // ── Portal View State ──────────────────────────────────────────────────────
  const [view, setView] = useState<"portals" | "system">("portals");
  const [activeSystemId, setActiveSystemId] = useState<SystemId | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "title" | "year" | "rating" | "plays">("recent");
  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filter games based on current view/system
  const allGames = useMemo(() => {
    const uploaded = roms.map(uploadedRomToGame);
    return [...uploaded, ...GAMES];
  }, [roms]);

  const systemsWithGames = useMemo(() => {
    return SYSTEMS.filter(s => allGames.some(g => g.system === s.id));
  }, [allGames]);

  const filteredGames = useMemo(() => {
    let list = allGames;

    // Filter by active system portal
    if (activeSystemId) {
      list = list.filter(g => g.system === activeSystemId);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const fuse = new Fuse(list, {
        keys: ["title", "system", "genre", "developer", "publisher"],
        threshold: 0.35,
        distance: 100,
      });
      list = fuse.search(searchQuery.trim()).map((r) => r.item);
    }

    // Sort: Default to A-Z within portals, Recent in global
    const effectiveSort = searchQuery ? sort : (activeSystemId ? "title" : "recent");

    return [...list].sort((a, b) => {
      switch (effectiveSort) {
        case "title": return a.title.localeCompare(b.title);
        case "year": return (a.year || 0) - (b.year || 0);
        case "rating": return (b.rating || 0) - (a.rating || 0);
        case "plays": return (b.minutesPlayed ?? 0) - (a.minutesPlayed ?? 0);
        case "recent":
        default: return (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0);
      }
    });
  }, [allGames, activeSystemId, searchQuery, sort]);

  const activeGame = filteredGames[activeGameIdx];

  // Grid Navigation
  const gridRef = useRef<HTMLDivElement>(null);
  const { focusedIndex, setFocusedIndex } = useGridNav({
    count: view === "system" || searchQuery ? filteredGames.length : systemsWithGames.length,
    gridRef,
    disabled: !!dialogGame,
    onActivate: (idx) => {
      if (view === "portals" && !searchQuery) {
        const sys = systemsWithGames[idx];
        if (sys) {
          setActiveSystemId(sys.id);
          setView("system");
          setActiveGameIdx(0);
        }
      } else {
        const game = filteredGames[idx];
        if (game) openGame(game);
      }
    },
    onFocusChange: (idx) => {
      if (idx >= 0 && (view === "system" || searchQuery)) setActiveGameIdx(idx);
    }
  });

  // Sync manual mouse selection back to grid nav focus
  useEffect(() => {
    if (activeGameIdx !== focusedIndex) setFocusedIndex(activeGameIdx);
  }, [activeGameIdx, focusedIndex, setFocusedIndex]);

  // Handle system switching via portal clicks
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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0c0c0c] text-white select-none overflow-hidden font-sans relative">
      
      {/* Background Fanart */}
      <AnimatePresence mode="wait">
        {(view === "system" || searchQuery) && activeGame && (
          <motion.div key={activeGame.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0 z-0 pointer-events-none">
            {activeGame.artUrl ? (
              <img src={apiUrl(activeGame.romId ? `/api/roms/${activeGame.romId}/art` : `/api/art?url=${encodeURIComponent(activeGame.artUrl)}`)} className="w-full h-full object-cover opacity-20 blur-[20px] scale-110" alt="" />
            ) : (
              <div className="w-full h-full opacity-10" style={{ background: `radial-gradient(circle at center, hsl(${activeGame.art[0]}), #000 80%)` }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-transparent to-[#0c0c0c]/90" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        
        {/* Header / Search */}
        <header className="shrink-0 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {view === "system" && !searchQuery && (
                <Button variant="ghost" size="icon" onClick={backToPortals} className="rounded-full bg-white/5 hover:bg-white/10 text-white/60">
                  <ArrowLeft className="size-5" />
                </Button>
              )}
              <h1 className="font-display text-2xl font-black tracking-tight flex items-center gap-2">
                {searchQuery ? "Search Results" : view === "system" ? SYSTEMS.find(s => s.id === activeSystemId)?.name : "Game Library"}
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] ml-2">
                  {filteredGames.length} Titles
                </span>
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group hidden sm:block">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
                <Input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles..."
                  className="w-48 md:w-64 h-9 pl-9 bg-white/5 border-white/5 rounded-full text-xs font-medium focus:ring-primary/40 focus:border-primary/40 group-hover:bg-white/10 transition-all"
                />
              </div>
              <Link href="/settings" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <Settings className="size-5 text-white/40" />
              </Link>
            </div>
          </div>
        </header>

        <main ref={gridRef} className="flex-1 overflow-y-auto px-6 pb-24 scrollbar-none overscroll-contain">
          <AnimatePresence mode="wait">
            
            {/* 1. PORTALS VIEW (Default Landing) */}
            {view === "portals" && !searchQuery && (
              <motion.div key="portals" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4, ease: "easeOut" }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              >
                {systemsWithGames.map((system, i) => {
                  const count = allGames.filter(g => g.system === system.id).length;
                  return (
                    <motion.button key={system.id} whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} onClick={() => enterPortal(system.id)}
                      className="group relative aspect-[16/11] rounded-3xl overflow-hidden border border-white/5 text-left transition-all hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                      style={{ background: `linear-gradient(135deg, hsl(${system.art[0]}) 0%, hsl(${system.art[1]}) 100%)` }}
                    >
                      {system.image && (
                        <img src={system.image.url} alt="" className="absolute -right-4 -bottom-4 h-4/5 object-contain opacity-40 group-hover:scale-110 group-hover:opacity-70 transition-all duration-700 pointer-events-none" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute inset-0 p-5 flex flex-col justify-between">
                        <div className="font-black text-xs text-white/40 tracking-[0.2em]">{system.mono}</div>
                        <div>
                          <div className="font-display text-lg font-black uppercase leading-tight text-white drop-shadow-lg">{system.shortName}</div>
                          <div className="text-[10px] font-mono text-white/50 uppercase tracking-widest mt-1 font-bold">{count} Games</div>
                        </div>
                      </div>
                      <div className="absolute inset-0 rounded-3xl border-2 border-white/0 group-hover:border-white/20 transition-colors pointer-events-none" />
                    </motion.button>
                  );
                })}
              </motion.div>
            )}

            {/* 2. GAME GRID VIEW (Drill-down or Search) */}
            {(view === "system" || searchQuery) && (
              <motion.div key="grid" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
                className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
              >
                {isRomsLoading ? (
                  <GameCardSkeleton count={18} />
                ) : filteredGames.length === 0 ? (
                  <div className="col-span-full h-64 flex flex-col items-center justify-center text-white/20">
                    <Search className="size-12 mb-4 opacity-50" />
                    <div className="font-display text-sm font-black uppercase tracking-widest">No matching games</div>
                    <Button variant="ghost" onClick={() => setSearchQuery("")} className="mt-4 text-xs">Clear Search</Button>
                  </div>
                ) : (
                  filteredGames.map((game, i) => {
                    const isActive = i === activeGameIdx;
                    return (
                      <motion.div key={game.id} data-testid={`card-game-${game.id}`} animate={{ scale: isActive ? 1.06 : 1 }} whileHover={{ scale: 1.06, y: -4 }} onClick={() => openGame(game)}
                        className={`relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 ${isActive ? "ring-2 ring-primary shadow-[0_0_30px_rgba(var(--primary),0.25)] z-10" : "ring-1 ring-white/10 hover:ring-white/25"}`}
                      >
                        <div className="absolute inset-0 bg-neutral-900/50 flex items-center justify-center">
                          {game.artUrl ? (
                            <img src={apiUrl(game.romId ? `/api/roms/${game.romId}/art` : `/api/art?url=${encodeURIComponent(game.artUrl)}`)} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <span className="text-[10px] font-black uppercase text-white/20 px-2 text-center leading-tight">{game.title}</span>
                          )}
                        </div>
                        {isActive && (
                          <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 ring-2 ring-primary rounded-xl pointer-events-none" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
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

      <WelcomeDialog hasRoms={roms.length > 0} />
    </div>
  );
}
