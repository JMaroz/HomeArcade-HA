import React, { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { uploadedRomToGame, SYSTEMS, type Game, type System } from "@/data/library";
import { GameDetailDialog } from "@/components/GameDetailDialog";
import { MobileTopBar } from "@/components/MobileNav";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/queryClient";
import { formatRelative, useIntegration } from "@/lib/integration";
import { useGameDialogState } from "@/lib/useGameDialogState";
import type { UploadedRom, GameCollectionWithItems } from "@shared/schema";
import { 
  Play, 
  Star,
  Gamepad2,
  Calendar,
  Layers,
  ChevronRight,
  Monitor,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

export default function ArtBookNextTheme() {
  const { config } = useIntegration();
  const { t } = useTranslation();
  const { data: roms = [] } = useQuery<UploadedRom[]>({ queryKey: ["/api/roms"] });
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

  const games = useMemo(() => roms.map(uploadedRomToGame), [roms]);

  const systemsWithGames = useMemo(() => {
    const groups: Record<string, Game[]> = {};
    for (const g of games) {
      if (!groups[g.system]) groups[g.system] = [];
      groups[g.system].push(g);
    }
    
    return SYSTEMS.map(s => ({
      system: s,
      games: groups[s.id] || []
    })).filter(group => group.games.length > 0);
  }, [games]);

  const [activeSystemIdx, setActiveSystemIdx] = useState(0);
  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const [view, setView] = useState<"systems" | "games">("systems");

  const currentSystem = systemsWithGames[activeSystemIdx];
  const activeGame = currentSystem?.games[activeGameIdx];

  // Navigation Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (dialogGame) return;

      if (view === "systems") {
        if (e.key === "ArrowRight") {
          setActiveSystemIdx(i => (i + 1) % systemsWithGames.length);
        } else if (e.key === "ArrowLeft") {
          setActiveSystemIdx(i => (i - 1 + systemsWithGames.length) % systemsWithGames.length);
        } else if (e.key === "Enter") {
          setView("games");
          setActiveGameIdx(0);
        }
      } else {
        if (e.key === "ArrowDown") {
          setActiveGameIdx(i => Math.min(i + 1, (currentSystem?.games.length || 1) - 1));
        } else if (e.key === "ArrowUp") {
          setActiveGameIdx(i => Math.max(i - 1, 0));
        } else if (e.key === "ArrowLeft") {
          setView("systems");
        } else if (e.key === "Enter" && activeGame) {
          openGame(activeGame);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSystemIdx, activeGameIdx, systemsWithGames, dialogGame, currentSystem, activeGame, view]);

  return (
    <div className="fixed inset-0 lg:left-0 z-[50] bg-white text-[#1a1a1a] flex flex-col select-none overflow-hidden font-sans">
      <MobileTopBar />

      <AnimatePresence mode="wait">
        {view === "systems" ? (
          <motion.div
            key="systems"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center relative p-20"
          >
             {/* System Hero Section */}
             <div className="flex-1 w-full flex items-center justify-between gap-20">
                <div className="flex-1 space-y-8">
                   <div className="font-mono text-xs uppercase tracking-[0.4em] text-gray-300">System Portfolio</div>
                   <h1 className="text-8xl font-black uppercase tracking-tighter leading-none text-black drop-shadow-sm">
                      {currentSystem?.system.name}
                   </h1>
                   <div className="flex gap-12 pt-8">
                      <div className="space-y-1">
                         <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Library Size</div>
                         <div className="text-2xl font-bold">{currentSystem?.games.length} Entries</div>
                      </div>
                      <div className="space-y-1">
                         <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Era</div>
                         <div className="text-2xl font-bold">{currentSystem?.system.era || "Classic"}</div>
                      </div>
                   </div>
                   <div className="pt-12">
                      <Button onClick={() => setView("games")} className="h-16 px-12 rounded-none bg-black text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-gray-800">
                         View Collection
                      </Button>
                   </div>
                </div>
                
                <div className="flex-1 h-full relative group">
                   <div className="absolute inset-0 bg-gray-50 -rotate-3 scale-105 transition-transform group-hover:rotate-0" />
                   <div className="absolute inset-0 border-[20px] border-white shadow-2xl relative bg-gray-100 flex items-center justify-center overflow-hidden">
                      <Gamepad2 className="size-64 text-white opacity-50" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent" />
                   </div>
                </div>
             </div>

             {/* Horizontal System Ribbon (Bottom) */}
             <div className="w-full h-24 border-t border-gray-100 flex items-center gap-10 overflow-x-auto scrollbar-none no-scrollbar">
                {systemsWithGames.map((group, i) => (
                  <button
                    key={group.system.id}
                    onClick={() => { setActiveSystemIdx(i); }}
                    className={`text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      i === activeSystemIdx ? "text-black scale-110" : "text-gray-200 hover:text-gray-400"
                    }`}
                  >
                    {group.system.shortName}
                  </button>
                ))}
             </div>
          </motion.div>
        ) : (
          <motion.div
            key="games"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex min-h-0"
          >
             {/* Left: Magazine Content */}
             <div className="flex-1 h-full p-20 flex flex-col">
                <div className="flex items-center justify-between mb-20">
                   <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView("systems")}>
                      <ChevronRight className="size-5 rotate-180" />
                      <span className="font-mono text-xs uppercase tracking-[0.4em] text-gray-400">Back to Systems</span>
                   </div>
                   <div className="text-xs font-black uppercase tracking-widest text-primary italic">Art Book Next Edition</div>
                </div>

                <AnimatePresence mode="wait">
                   {activeGame && (
                     <motion.div
                       key={activeGame.id}
                       initial={{ opacity: 0, x: -30 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -30 }}
                       transition={{ duration: 0.4 }}
                       className="flex-1 flex flex-col"
                     >
                        <div className="flex-1 flex gap-20">
                           <div className="flex-1 space-y-10">
                              <div className="space-y-4">
                                 <div className="flex items-center gap-3 text-primary font-bold font-mono text-xs uppercase tracking-widest">
                                    <Monitor className="size-3" /> {currentSystem.system.name}
                                 </div>
                                 <h1 className="text-7xl font-black uppercase tracking-tighter leading-[0.9] text-black">
                                    {activeGame.title}
                                 </h1>
                                 <div className="flex items-center gap-6 pt-4">
                                    <div className="flex items-center gap-1.5 text-black font-bold">
                                       <Star className="size-5 fill-current" />
                                       <span className="text-xl">{activeGame.rating || '-'}/5</span>
                                    </div>
                                    <div className="font-mono text-sm uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                       <Calendar className="size-4" /> {activeGame.year || '----'}
                                    </div>
                                    <div className="font-mono text-sm uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                       <Layers className="size-4" /> {activeGame.genre}
                                    </div>
                                 </div>
                              </div>

                              <p className="text-xl text-gray-500 leading-relaxed font-medium line-clamp-5 max-w-2xl">
                                 {activeGame.description || "A masterpiece of digital design. Curated for the modern collector. Initializing archive entry..."}
                              </p>

                              <div className="pt-10 flex gap-6">
                                 <Button 
                                   onClick={() => {
                                     const returnTo = encodeURIComponent(window.location.href);
                                     window.location.href = apiUrl(`/api/roms/${activeGame.romId}/player?return=${returnTo}`);
                                   }}
                                   className="h-16 px-12 rounded-none bg-black text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-gray-800 shadow-2xl transition-transform active:scale-95"
                                 >
                                    Execute Sequence
                                 </Button>
                                 <Button 
                                   variant="outline"
                                   onClick={() => openGame(activeGame)}
                                   className="h-16 px-10 rounded-none border-gray-200 text-gray-400 font-bold uppercase tracking-widest text-xs hover:border-black hover:text-black"
                                 >
                                    Technical Specs
                                 </Button>
                              </div>
                           </div>

                           <div className="w-[500px] shrink-0 relative">
                              <div className="absolute inset-0 bg-gray-100 rotate-2 scale-105" />
                              <div className="absolute inset-0 border-[30px] border-white shadow-2xl bg-white overflow-hidden relative">
                                 {activeGame.artUrl ? (
                                   <img src={activeGame.artUrl} className="w-full h-full object-cover" />
                                 ) : (
                                   <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                      <Gamepad2 className="size-32 text-gray-100" />
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     </motion.div>
                   )}
                </AnimatePresence>
             </div>

             {/* Right: Vertical Scrolling List */}
             <div className="w-80 h-full border-l border-gray-100 bg-gray-50/50 flex flex-col p-10">
                <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-10">Index</div>
                <div className="flex-1 overflow-y-auto scrollbar-none no-scrollbar space-y-6">
                   {currentSystem?.games.map((game, i) => {
                     const isActive = i === activeGameIdx;
                     return (
                       <button
                         key={game.id}
                         onClick={() => setActiveGameIdx(i)}
                         className={`w-full text-left transition-all ${
                           isActive ? "text-black scale-105 font-black" : "text-gray-300 hover:text-gray-500 font-bold"
                         }`}
                       >
                          <div className="text-xs uppercase tracking-tighter truncate">{game.title}</div>
                       </button>
                     );
                   })}
                </div>
             </div>
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
      <WelcomeDialog hasRoms={roms.length > 0} />
    </div>
  );
}
