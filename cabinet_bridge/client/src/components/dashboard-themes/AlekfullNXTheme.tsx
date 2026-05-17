import React, { useMemo, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { uploadedRomToGame, SYSTEMS, type Game, type System } from "@/data/library";
import { GameDetailDialog } from "@/components/GameDetailDialog";
import { MobileTopBar } from "@/components/MobileNav";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/queryClient";
import { useIntegration } from "@/lib/integration";
import { useGameDialogState } from "@/lib/useGameDialogState";
import type { UploadedRom, GameCollectionWithItems } from "@shared/schema";
import { 
  Play, 
  Star,
  Gamepad2,
  ChevronRight,
  Battery,
  Wifi,
  Clock,
  ChevronLeft
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

export default function AlekfullNXTheme() {
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

  // Navigation Logic (Switch-like)
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
           if (activeGameIdx === 0) setView("systems");
        } else if (e.key === "Escape" || e.key === "Backspace") {
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

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 lg:left-0 z-[50] bg-[#ebebeb] text-[#424242] flex flex-col select-none overflow-hidden font-sans">
      <MobileTopBar />

      {/* Top Status Bar */}
      <div className="h-14 px-6 sm:px-12 flex items-center justify-between z-20 shrink-0">
         <div className="flex items-center gap-4">
            <div className="size-8 sm:size-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
               <User className="size-5 sm:size-6 text-gray-400" />
            </div>
            <span className="font-bold text-xs sm:text-sm">Player 1</span>
         </div>
         <div className="flex items-center gap-4 sm:gap-6 text-gray-500">
            <Clock className="size-3 sm:size-4" />
            <span className="font-bold text-xs sm:text-sm">
               {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <Wifi className="size-3 sm:size-4 hidden sm:block" />
            <Battery className="size-3 sm:size-4 hidden sm:block" />
         </div>
      </div>

      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {view === "systems" ? (
            <motion.div
              key="systems"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col justify-center overflow-hidden"
            >
               <div className="relative h-48 sm:h-64 flex items-center">
                  <motion.div 
                    className="flex gap-4 px-[50vw]"
                    animate={{ x: activeSystemIdx * -(window.innerWidth < 640 ? 192 : 256) - (window.innerWidth < 640 ? 96 : 128) }}
                    transition={{ type: "spring", stiffness: 200, damping: 30 }}
                  >
                     {systemsWithGames.map((group, i) => {
                       const isActive = i === activeSystemIdx;
                       return (
                         <motion.button
                           key={group.system.id}
                           onClick={() => { setActiveSystemIdx(i); setView("games"); }}
                           animate={{ 
                             scale: isActive ? 1.1 : 0.9,
                             opacity: isActive ? 1 : 0.6
                           }}
                           className={`relative w-48 sm:w-64 aspect-square rounded-2xl bg-white shadow-lg border-4 transition-colors flex flex-col items-center justify-center p-4 sm:p-8 ${
                             isActive ? "border-[#00c3e3]" : "border-transparent"
                           }`}
                         >
                            <div className="flex-1 flex items-center justify-center">
                               <Gamepad2 className={`size-16 sm:size-24 transition-colors ${isActive ? "text-[#00c3e3]" : "text-gray-300"}`} />
                            </div>
                            <div className={`mt-2 sm:mt-4 font-black uppercase text-center text-[10px] sm:text-sm tracking-tighter ${isActive ? "text-gray-800" : "text-gray-400"}`}>
                               {group.system.name}
                            </div>
                         </motion.button>
                       );
                     })}
                  </motion.div>
               </div>
               
               <div className="mt-12 sm:mt-20 text-center">
                  <div className="text-2xl sm:text-4xl font-black uppercase tracking-tighter text-gray-800">
                     {currentSystem?.system.name}
                  </div>
                  <div className="mt-2 text-gray-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs">
                     {currentSystem?.games.length} Titles Available
                  </div>
               </div>
            </motion.div>
          ) : (
            <motion.div
              key="games"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
               <div className="px-6 sm:px-12 py-4 sm:py-6 flex items-center justify-between border-b border-gray-200 bg-white/50 backdrop-blur-sm shrink-0">
                  <div className="flex items-center gap-4">
                     <Button variant="ghost" size="icon" onClick={() => setView("systems")} className="rounded-full">
                        <ChevronLeft className="size-6" />
                     </Button>
                     <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">{currentSystem?.system.name}</h2>
                  </div>
               </div>

               <div className="flex-1 flex min-h-0 overflow-hidden">
                  {/* Game List */}
                  <div className="w-full lg:w-1/3 h-full overflow-y-auto border-r border-gray-200 bg-white scrollbar-none no-scrollbar">
                     {currentSystem?.games.map((game, i) => {
                       const isActive = i === activeGameIdx;
                       return (
                         <div
                           key={game.id}
                           onMouseEnter={() => { if (window.innerWidth >= 1024) setActiveGameIdx(i); }}
                           onClick={() => {
                              setActiveGameIdx(i);
                              if (window.innerWidth < 1024) setShowMobileDetails(true);
                              else openGame(game);
                           }}
                           className={`px-6 sm:px-12 py-4 sm:py-6 cursor-pointer border-l-8 transition-colors ${
                             isActive ? "bg-[#00c3e3]/10 border-[#00c3e3] font-bold" : "border-transparent"
                           }`}
                         >
                            <div className="truncate uppercase text-xs sm:text-sm tracking-tight">{game.title}</div>
                         </div>
                       );
                     })}
                  </div>

                  {/* Metadata (Detail) - Desktop Only */}
                  <div className="hidden lg:flex flex-1 h-full p-12 overflow-y-auto flex-col gap-8 bg-[#f5f5f5]">
                     <AnimatePresence mode="wait">
                        {activeGame && (
                          <motion.div
                            key={activeGame.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-10"
                          >
                             <div className="flex gap-10">
                                <div className="w-64 aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white shrink-0 bg-white">
                                   {activeGame.artUrl ? (
                                     <img src={activeGame.artUrl} className="w-full h-full object-cover" />
                                   ) : (
                                     <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-200">
                                        <Gamepad2 className="size-20" />
                                     </div>
                                   )}
                                </div>
                                <div className="flex-1 space-y-6 pt-4">
                                   <h1 className="text-5xl font-black uppercase tracking-tighter leading-none text-gray-800">{activeGame.title}</h1>
                                   <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-1 text-orange-500 font-bold">
                                         <Star className="size-5 fill-current" />
                                         <span className="text-xl">{activeGame.rating || '-'}/5</span>
                                      </div>
                                      <div className="px-3 py-1 rounded bg-white border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-widest">{activeGame.year || '----'}</div>
                                      <div className="px-3 py-1 rounded bg-white border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-widest">{activeGame.genre}</div>
                                   </div>
                                   <p className="text-lg text-gray-500 leading-relaxed font-medium line-clamp-6">{activeGame.description || "Initializing software synopsis..."}</p>
                                </div>
                             </div>

                             <div className="flex gap-4">
                                <Button 
                                  onClick={() => {
                                    const returnTo = encodeURIComponent(window.location.href);
                                    window.location.href = apiUrl(`/api/roms/${activeGame.romId}/player?return=${returnTo}`);
                                  }}
                                  className="h-16 px-12 rounded-full bg-[#00c3e3] hover:bg-[#00a8c2] text-white font-black uppercase tracking-widest text-sm shadow-xl"
                                >
                                  Start Game
                                </Button>
                             </div>
                          </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Details Drawer */}
      <AnimatePresence>
         {showMobileDetails && activeGame && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 top-20 bg-white z-[100] p-6 border-t border-gray-200 flex flex-col gap-6 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)]"
            >
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={() => setShowMobileDetails(false)}
                 className="absolute top-4 right-4 text-gray-300"
               >
                 <ChevronLeft className="size-6 rotate-270" />
               </Button>

               <div className="flex gap-6 items-start mt-4">
                  <div className="w-32 aspect-[2/3] rounded-2xl overflow-hidden shadow-xl shrink-0 border-2 border-white">
                     {activeGame.artUrl ? <img src={activeGame.artUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100" />}
                  </div>
                  <div className="flex-1 space-y-2">
                     <h2 className="text-2xl font-black uppercase tracking-tighter leading-tight">{activeGame.title}</h2>
                     <div className="flex flex-wrap gap-2 pt-1">
                        <div className="text-[10px] font-bold text-orange-500 flex items-center gap-1">
                           <Star className="size-3 fill-current" /> {activeGame.rating || '-'}/5
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full">{activeGame.year || '----'}</div>
                     </div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto scrollbar-none no-scrollbar">
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">{activeGame.description || "Experience the software on your device."}</p>
               </div>

               <Button 
                 onClick={() => {
                   const returnTo = encodeURIComponent(window.location.href);
                   window.location.href = apiUrl(`/api/roms/${activeGame.romId}/player?return=${returnTo}`);
                 }}
                 className="h-16 rounded-full bg-[#00c3e3] text-white font-black uppercase tracking-widest text-sm shadow-xl"
               >
                  Execute Program
               </Button>
            </motion.div>
         )}
      </AnimatePresence>

      {/* Bottom Bar */}
      <div className="h-14 px-12 border-t border-gray-200 bg-white flex items-center justify-between z-20 shrink-0">
         <div className="flex items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-2 sm:gap-3">
               <div className="size-6 sm:size-7 rounded-full bg-gray-200 flex items-center justify-center font-bold text-[10px] sm:text-sm">A</div>
               <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">{view === "systems" ? "Select" : "Start"}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
               <div className="size-6 sm:size-7 rounded-full bg-gray-200 flex items-center justify-center font-bold text-[10px] sm:text-sm">B</div>
               <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">Back</span>
            </div>
         </div>
         <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">NX Version 2.12</div>
      </div>

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
