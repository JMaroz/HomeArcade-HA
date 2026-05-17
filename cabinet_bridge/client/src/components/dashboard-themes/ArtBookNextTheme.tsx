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
  ChevronLeft
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
  const [showMobileDetails, setShowMobileDetails] = useState(false);

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
          if (window.innerWidth < 1024) setShowMobileDetails(true);
          else openGame(activeGame);
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
            className="flex-1 flex flex-col items-center justify-center relative p-6 sm:p-20"
          >
             {/* System Hero Section */}
             <div className="flex-1 w-full flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-20">
                <div className="flex-1 space-y-4 sm:space-y-8 text-center lg:text-left">
                   <div className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.4em] text-gray-300">Portfolio v2.13</div>
                   <h1 className="text-5xl sm:text-8xl font-black uppercase tracking-tighter leading-none text-black drop-shadow-sm">
                      {currentSystem?.system.name}
                   </h1>
                   <div className="flex justify-center lg:justify-start gap-8 sm:gap-12 pt-4 sm:pt-8">
                      <div className="space-y-1">
                         <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-400">Library</div>
                         <div className="text-xl sm:text-2xl font-bold">{currentSystem?.games.length}</div>
                      </div>
                      <div className="space-y-1">
                         <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-400">Era</div>
                         <div className="text-xl sm:text-2xl font-bold">{currentSystem?.system.era || "Classic"}</div>
                      </div>
                   </div>
                   <div className="pt-8 sm:pt-12">
                      <Button onClick={() => setView("games")} className="h-14 sm:h-16 px-8 sm:px-12 rounded-none bg-black text-white font-black uppercase tracking-[0.2em] text-xs sm:text-sm hover:bg-gray-800 shadow-xl">
                         Open Collection
                      </Button>
                   </div>
                </div>
                
                <div className="w-full sm:w-2/3 lg:flex-1 h-64 lg:h-full relative group">
                   <div className="absolute inset-0 bg-gray-50 -rotate-3 scale-105 transition-transform group-hover:rotate-0" />
                   <div className="absolute inset-0 border-[10px] sm:border-[20px] border-white shadow-2xl relative bg-gray-100 flex items-center justify-center overflow-hidden">
                      <Gamepad2 className="size-32 sm:size-64 text-white opacity-50" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent" />
                   </div>
                </div>
             </div>

             {/* Horizontal System Ribbon */}
             <div className="w-full h-16 sm:h-24 border-t border-gray-100 flex items-center gap-6 sm:gap-10 overflow-x-auto scrollbar-none no-scrollbar mt-8 sm:mt-0">
                {systemsWithGames.map((group, i) => (
                  <button
                    key={group.system.id}
                    onClick={() => { setActiveSystemIdx(i); }}
                    className={`text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${
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
            className="flex-1 flex min-h-0 overflow-hidden"
          >
             {/* Left Content Area */}
             <div className="flex-1 h-full p-6 sm:p-12 lg:p-20 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-10 sm:mb-20 shrink-0">
                   <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView("systems")}>
                      <ChevronLeft className="size-5 text-gray-300" />
                      <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.4em] text-gray-400">Back</span>
                   </div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-primary italic hidden sm:block">Art Book Next Edition</div>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row gap-10 lg:gap-20 overflow-hidden">
                   {/* Metadata View (Desktop) */}
                   <div className="hidden lg:flex flex-1 flex-col overflow-hidden">
                      <AnimatePresence mode="wait">
                         {activeGame && (
                           <motion.div
                             key={activeGame.id}
                             initial={{ opacity: 0, x: -30 }}
                             animate={{ opacity: 1, x: 0 }}
                             exit={{ opacity: 0, x: -30 }}
                             transition={{ duration: 0.4 }}
                             className="flex-1 flex flex-col min-h-0"
                           >
                              <div className="space-y-4 sm:space-y-6">
                                 <div className="flex items-center gap-3 text-primary font-bold font-mono text-[10px] sm:text-xs uppercase tracking-widest">
                                    <Monitor className="size-3" /> {currentSystem.system.name}
                                 </div>
                                 <h1 className="text-4xl sm:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-black line-clamp-3">
                                    {activeGame.title}
                                 </h1>
                                 <div className="flex items-center gap-6 pt-2 sm:pt-4">
                                    <div className="flex items-center gap-1.5 text-black font-bold">
                                       <Star className="size-4 sm:size-5 fill-current" />
                                       <span className="text-lg">{activeGame.rating || '-'}/5</span>
                                    </div>
                                    <div className="font-mono text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                       <Calendar className="size-4" /> {activeGame.year || '----'}
                                    </div>
                                 </div>
                              </div>

                              <p className="mt-8 text-lg text-gray-500 leading-relaxed font-medium line-clamp-4 max-w-2xl">
                                 {activeGame.description || "A masterpiece of digital design. Curated for the modern collector."}
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
                              </div>
                           </motion.div>
                         )}
                      </AnimatePresence>
                   </div>

                   {/* Artwork Column (Master) */}
                   <div className="flex-1 lg:w-[500px] lg:shrink-0 relative overflow-hidden">
                      <AnimatePresence mode="wait">
                         {activeGame && (
                           <motion.div
                             key={activeGame.id + "-art"}
                             initial={{ opacity: 0, scale: 0.95 }}
                             animate={{ opacity: 1, scale: 1 }}
                             exit={{ opacity: 0, scale: 0.95 }}
                             className="w-full h-full relative"
                           >
                              <div className="absolute inset-0 bg-gray-100 rotate-2 scale-105" />
                              <div className="absolute inset-0 border-[15px] sm:border-[30px] border-white shadow-2xl bg-white overflow-hidden relative">
                                 {activeGame.artUrl ? (
                                   <img src={activeGame.artUrl} className="w-full h-full object-cover" />
                                 ) : (
                                   <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                      <Gamepad2 className="size-20 sm:size-32 text-gray-100" />
                                   </div>
                                 )}
                              </div>
                           </motion.div>
                         )}
                      </AnimatePresence>
                   </div>
                </div>
             </div>

             {/* Right Index List */}
             <div className="w-24 sm:w-80 h-full border-l border-gray-100 bg-gray-50/50 flex flex-col p-4 sm:p-10 shrink-0">
                <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-6 sm:mb-10 text-center sm:text-left">Index</div>
                <div className="flex-1 overflow-y-auto scrollbar-none no-scrollbar space-y-4 sm:space-y-6">
                   {currentSystem?.games.map((game, i) => {
                     const isActive = i === activeGameIdx;
                     return (
                       <button
                         key={game.id}
                         onClick={() => {
                           setActiveGameIdx(i);
                           if (window.innerWidth < 1024) setShowMobileDetails(true);
                         }}
                         className={`w-full text-left transition-all ${
                           isActive ? "text-black scale-105 font-black" : "text-gray-300 hover:text-gray-500 font-bold"
                         }`}
                       >
                          <div className="text-[10px] sm:text-xs uppercase tracking-tighter truncate">{game.title}</div>
                       </button>
                     );
                   })}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Details Drawer */}
      <AnimatePresence>
         {showMobileDetails && activeGame && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 top-20 bg-white z-[100] p-8 border-t border-gray-200 flex flex-col gap-8 rounded-t-[2.5rem] shadow-2xl"
            >
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={() => setShowMobileDetails(false)}
                 className="absolute top-4 right-4 text-gray-200"
               >
                 <ChevronLeft className="size-6 rotate-270" />
               </Button>

               <div className="flex-1 overflow-y-auto scrollbar-none no-scrollbar space-y-6 mt-4">
                  <div className="space-y-2">
                     <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{currentSystem.system.name}</div>
                     <h2 className="text-4xl font-black uppercase tracking-tighter leading-[0.9]">{activeGame.title}</h2>
                  </div>
                  <p className="text-lg text-gray-500 leading-relaxed font-medium">{activeGame.description || "The art of digital play."}</p>
                  <div className="flex gap-6 border-t border-gray-100 pt-6">
                     <div>
                        <div className="text-[9px] font-mono uppercase text-gray-300">Rating</div>
                        <div className="font-bold text-xl">{activeGame.rating || '-'}/5</div>
                     </div>
                     <div>
                        <div className="text-[9px] font-mono uppercase text-gray-300">Released</div>
                        <div className="font-bold text-xl">{activeGame.year || '----'}</div>
                     </div>
                  </div>
               </div>

               <Button 
                 onClick={() => {
                   const returnTo = encodeURIComponent(window.location.href);
                   window.location.href = apiUrl(`/api/roms/${activeGame.romId}/player?return=${returnTo}`);
                 }}
                 className="h-16 rounded-none bg-black text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl"
               >
                  Initialize Software
               </Button>
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
