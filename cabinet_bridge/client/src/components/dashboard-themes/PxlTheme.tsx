import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Fuse from "fuse.js";
import { useQuery } from "@tanstack/react-query";
import { uploadedRomToGame, GAMES, SYSTEMS, type Game, type System, type SystemId } from "@/data/library";
import { MobileTopBar } from "@/components/MobileNav";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/lib/queryClient";
import { useIntegration } from "@/lib/integration";
import { useGameDialogState } from "@/lib/useGameDialogState";
import type { UploadedRom, GameCollectionWithItems, RomSaveSlot, GameCheatCode } from "@shared/schema";
import {
  Play,
  Search,
  Settings as SettingsIcon,
  Star,
  ChevronRight,
  ChevronLeft,
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
  Smartphone,
  Wifi,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useGridNav } from "@/lib/useGridNav";
import { WarpLinkDialog } from "@/components/WarpLinkDialog";

// ─── PXL Sub-components ───────────────────────────────────────────────────────

function PxlWindow({ 
  title, 
  children, 
  onClose, 
  className = "" 
}: { 
  title: string; 
  children: React.ReactNode; 
  onClose?: () => void;
  className?: string;
}) {
  return (
    <div className={`pixel-panel flex flex-col overflow-hidden ${className}`}>
      <div className="bg-[#000080] text-white px-3 py-1.5 flex items-center justify-between gap-4">
        <span className="font-bold text-[11px] uppercase tracking-wider truncate">{title}</span>
        {onClose && (
          <button 
            onClick={onClose}
            className="pixel-btn size-5 flex items-center justify-center bg-[#c0c0c0] hover:bg-[#d0d0d0]"
          >
            <X className="size-3 text-black" strokeWidth={3} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4 bg-[#c0c0c0] custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

function PxlStatBar({ label, value, max, color = "bg-green-500" }: { label: string; value: number; max: number; color?: string }) {
  const percent = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold uppercase text-black/60 tracking-wider">{label}</span>
        <span className="text-[10px] font-bold text-black/80">{value}/{max}</span>
      </div>
      <div className="h-4 pixel-border-sm bg-black/20 p-0.5">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function PxlSaveSlot({ slot, romId, onDelete }: { slot: RomSaveSlot; romId: number; onDelete: () => void }) {
  const [thumbError, setThumbError] = useState(false);
  const thumbUrl = `/api/roms/${romId}/save-thumb/${slot.slot}`;

  return (
    <div className="pixel-border-sm bg-black/5 p-2 flex flex-col gap-2">
      <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
        {!thumbError ? (
          <img src={thumbUrl} alt="" className="w-full h-full object-cover pixel-rendering" onError={() => setThumbError(true)} />
        ) : (
          <Save className="size-4 text-white/20" />
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="text-[9px] font-bold uppercase truncate text-black/80">{slot.label}</div>
        <button onClick={onDelete} className="text-[8px] font-bold text-red-600 uppercase hover:underline text-left">Delete</button>
      </div>
    </div>
  );
}

// ─── Main Theme ───────────────────────────────────────────────────────────────

export default function PxlTheme() {
  const { config } = useIntegration();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: roms = [] } = useQuery<UploadedRom[]>({ queryKey: ["/api/roms"] });
  const { data: collections = [] } = useQuery<GameCollectionWithItems[]>({ queryKey: ["/api/collections"] });

  const {
    selectedGame: dialogGame,
    openGame,
    closeGame,
    handleToggleFav,
  } = useGameDialogState();

  const allGames = useMemo(() => [...roms.map(uploadedRomToGame), ...GAMES], [roms]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "title" | "year">("recent");
  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "cheats" | "saves">("info");

  const filteredGames = useMemo(() => {
    let list = allGames;
    const sysFilter = searchQuery.startsWith("filter:") ? searchQuery.slice(7).trim() : "";
    if (sysFilter) list = list.filter(g => g.system === sysFilter);
    else if (searchQuery.trim()) {
      const fuse = new Fuse(allGames, { keys: ["title", "system"], threshold: 0.35 });
      list = fuse.search(searchQuery.trim()).map(r => r.item);
    }
    return list.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "year") return (a.year || 0) - (b.year || 0);
      return (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0);
    });
  }, [allGames, searchQuery, sort]);

  const activeGame = filteredGames[activeGameIdx];

  const gridRef = useRef<HTMLDivElement>(null);
  const { focusedIndex, setFocusedIndex } = useGridNav({
    count: filteredGames.length,
    gridRef,
    disabled: !!dialogGame || (window.innerWidth < 1280 && showMobileDetails),
    onActivate: (idx) => {
      if (activeGameIdx === idx) {
        const game = filteredGames[idx];
        window.location.href = apiUrl(`/api/roms/${game.romId}/player?return=${encodeURIComponent(window.location.href)}`);
      } else {
        setActiveGameIdx(idx);
        if (window.innerWidth < 1280) setShowMobileDetails(true);
      }
    },
    onFocusChange: (idx) => idx >= 0 && setActiveGameIdx(idx)
  });

  useEffect(() => { if (activeGameIdx !== focusedIndex) setFocusedIndex(activeGameIdx); }, [activeGameIdx, focusedIndex]);

  const { data: raProgress } = useQuery({
    queryKey: ["ra-progress", activeGame?.raGameId],
    queryFn: async () => raGameId ? (await fetch(apiUrl(`/api/retroachievements/user-progress/${raGameId}`))).json() : null,
    enabled: !!activeGame?.raGameId && !!config.raUsername,
  });

  return (
    <div className="fixed inset-0 z-[50] bg-[#1a1a1a] pixel-bg text-black flex flex-col select-none overflow-hidden font-mono">
      <div className="shrink-0">
        <MobileTopBar />
      </div>
      
      {/* Top Menu Bar */}
      <div className="h-10 px-4 flex items-center justify-between border-b-2 border-black bg-[#c0c0c0] z-20">
        <div className="flex items-center gap-6">
          <div className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
            <LayoutGrid className="size-4" strokeWidth={3} />
            <span>HomeArcade PXL v1.0</span>
          </div>
          <div className="hidden sm:flex gap-4 text-[10px] font-bold uppercase text-black/60">
            <Link href="/history" className="hover:text-black">Activity</Link>
            <Link href="/settings" className="hover:text-black">Settings</Link>
          </div>
        </div>
        <div className="font-bold text-[11px] tabular-nums bg-black text-white px-3 py-1 pixel-border-sm">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative z-10 p-4 sm:p-6 lg:p-8">
        
        {/* Systems Row */}
        <div className="flex gap-3 overflow-x-auto scrollbar-none mb-6">
          {SYSTEMS.filter(s => allGames.some(g => g.system === s.id)).map(system => (
            <button
              key={system.id}
              onClick={() => setSearchQuery("filter:" + system.id)}
              className={`pixel-btn shrink-0 px-4 py-2 flex items-center gap-3 min-w-[120px] ${searchQuery === "filter:"+system.id ? "bg-primary text-white" : ""}`}
            >
              <div className="size-8 flex items-center justify-center">
                {system.image ? (
                  <img src={system.image.url} className="size-full object-contain pixel-rendering" alt="" />
                ) : (
                  <span className="font-bold text-[10px]">{system.mono}</span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase">{system.shortName}</span>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-6 min-h-0">
          
          {/* Game Grid */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH GAMES..."
                  className="w-full pl-10 pr-4 h-10 pixel-border bg-white text-[10px] font-bold focus:outline-none"
                />
              </div>
            </div>

            <div 
              ref={gridRef}
              className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid gap-4 grid-cols-[repeat(auto-fill,minmax(110px,1fr))]"
            >
              {filteredGames.map((game, i) => {
                const isActive = i === activeGameIdx;
                return (
                  <div
                    key={game.id}
                    onClick={() => {
                      setActiveGameIdx(i);
                      if (window.innerWidth < 1280) setShowMobileDetails(true);
                    }}
                    className={`relative aspect-[3/4] cursor-pointer transition-transform duration-75 active:scale-95 ${isActive ? "z-10" : ""}`}
                  >
                    <div className={`absolute inset-0 pixel-border ${isActive ? "bg-primary shadow-[4px_4px_0px_#000]" : "bg-white hover:bg-[#f0f0f0]"}`}>
                      <div className="h-full flex flex-col p-1.5">
                        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden mb-1.5">
                          {game.artUrl ? (
                            <img src={game.artUrl} className="w-full h-full object-cover pixel-rendering opacity-90" alt="" />
                          ) : (
                            <span className="text-[8px] font-bold uppercase text-white/40 px-1 text-center">{game.title}</span>
                          )}
                        </div>
                        <div className="h-8 flex flex-col justify-center">
                          <div className={`text-[9px] font-bold uppercase truncate leading-tight ${isActive ? "text-white" : "text-black"}`}>{game.title}</div>
                          <div className={`text-[7px] font-bold uppercase ${isActive ? "text-white/60" : "text-black/40"}`}>{game.system}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side Panel (Retro Window) */}
          <AnimatePresence>
            {(activeGame && (window.innerWidth >= 1280 || showMobileDetails)) && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }}
                className="fixed inset-0 sm:relative sm:inset-auto sm:w-[400px] 2xl:w-[450px] z-[60] flex flex-col"
              >
                <PxlWindow 
                  title={`GAME_INFO: ${activeGame.title}`} 
                  onClose={() => setShowMobileDetails(false)}
                  className="h-full shadow-[8px_8px_0px_rgba(0,0,0,0.3)]"
                >
                  <div className="space-y-6">
                    {/* Art Header */}
                    <div className="pixel-border bg-black aspect-video flex items-center justify-center overflow-hidden">
                      {activeGame.artUrl ? (
                        <img src={activeGame.artUrl} className="w-full h-full object-cover pixel-rendering" alt="" />
                      ) : (
                        <div className="text-white/20 uppercase font-bold text-[10px]">No Video Signal</div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="pixel-border-sm bg-white/40 p-3">
                        <div className="text-[8px] font-bold text-black/40 uppercase mb-1">Status</div>
                        <div className="text-[10px] font-bold text-green-700">ONLINE</div>
                      </div>
                      <div className="pixel-border-sm bg-white/40 p-3">
                        <div className="text-[8px] font-bold text-black/40 uppercase mb-1">Plays</div>
                        <div className="text-[10px] font-bold text-black/80">{Math.floor((activeGame.minutesPlayed || 0) / 60)}H</div>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1">
                      {(["info", "cheats", "saves"] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setActiveTab(t)}
                          className={`pixel-btn flex-1 py-1 text-[9px] font-bold uppercase ${activeTab === t ? "bg-primary text-white shadow-none translate-y-px" : ""}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <div className="min-h-[200px]">
                      {activeTab === "info" && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                          <p className="text-[11px] leading-relaxed font-bold text-black/70">
                            {activeGame.description || "NO METADATA RETRIEVED FROM DATABASE."}
                          </p>
                          {raProgress && (
                            <PxlStatBar 
                              label="Achievements" 
                              value={raProgress.NumAwarded} 
                              max={raProgress.NumAchievements} 
                              color="bg-yellow-400"
                            />
                          )}
                        </div>
                      )}

                      {activeTab === "saves" && (
                        <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
                           {/* Add Save Slot Logic here if needed */}
                           <div className="col-span-2 text-center py-8 border-2 border-dashed border-black/10 text-[9px] font-bold text-black/40 uppercase tracking-widest">
                             System Storage Ready
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-4 border-t-2 border-black/10">
                      <button
                        onClick={() => {
                          const returnTo = encodeURIComponent(window.location.href);
                          window.location.href = apiUrl(`/api/roms/${activeGame.romId}/player?return=${returnTo}`);
                        }}
                        className="pixel-btn-primary w-full h-12 flex items-center justify-center gap-3 font-bold uppercase tracking-[0.2em] text-xs"
                      >
                        <Play className="size-4 fill-current" />
                        Execute Game
                      </button>
                      <div className="flex gap-2">
                        <button className="pixel-btn flex-1 h-10 text-[9px] font-bold uppercase flex items-center justify-center gap-2">
                          <Star className={`size-3 ${activeGame.favorite ? "fill-yellow-500 text-yellow-500" : ""}`} />
                          Fav
                        </button>
                        <button className="pixel-btn flex-1 h-10 text-[9px] font-bold uppercase flex items-center justify-center gap-2">
                          <QrCode className="size-3" />
                          Warp
                        </button>
                      </div>
                    </div>
                  </div>
                </PxlWindow>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 12px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #c0c0c0; border: 2px solid #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #808080; border: 2px solid #fff; box-shadow: inset -2px -2px 0 #000; }
      `}} />
    </div>
  );
}
