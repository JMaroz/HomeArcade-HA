import React, { useMemo, useState, useEffect } from "react";
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
  ChevronLeft
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

export default function ColorfulTheme() {
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
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  
  const currentSystem = systemsWithGames[activeSystemIdx];
  const activeGame = currentSystem?.games[activeGameIdx];

  // Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (dialogGame) return;

      if (e.key === "ArrowRight") {
        setActiveGameIdx(i => Math.min(i + 1, (currentSystem?.games.length || 1) - 1));
      } else if (e.key === "ArrowLeft") {
        setActiveGameIdx(i => Math.max(i - 1, 0));
      } else if (e.key === "ArrowDown") {
        setActiveSystemIdx(i => (i + 1) % systemsWithGames.length);
        setActiveGameIdx(0);
      } else if (e.key === "ArrowUp") {
        setActiveSystemIdx(i => (i - 1 + systemsWithGames.length) % systemsWithGames.length);
        setActiveGameIdx(0);
      } else if (e.key === "Enter" && activeGame) {
        if (window.innerWidth < 1024) setShowMobileDetails(true);
        else openGame(activeGame);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSystemIdx, activeGameIdx, systemsWithGames, dialogGame, currentSystem, activeGame]);

  return (
    <div className="fixed inset-0 lg:left-0 z-[50] bg-black text-white flex flex-col select-none overflow-hidden font-sans transition-colors duration-700">
      <MobileTopBar />

      {/* Full-screen System Gradient */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSystem?.system.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(135deg, hsl(${currentSystem?.system.art[0] || '0 0% 10%'}) 0%, #000 100%)`
          }}
        >
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex-1 flex flex-col p-6 sm:p-12 lg:p-20 overflow-hidden">
        
        {/* Header: Simplified Logo + System Name */}
        <div className="flex items-baseline gap-4 sm:gap-6 mb-8 sm:mb-20">
           <h1 className="text-3xl sm:text-6xl font-black uppercase tracking-tighter italic shrink-0">Colorful</h1>
           <div className="h-6 sm:h-10 w-px bg-white/20" />
           <div className="text-sm sm:text-3xl font-bold text-white/40 uppercase tracking-widest truncate">
              {currentSystem?.system.name || "Select System"}
           </div>
        </div>

        {/* Content Section: Giant Carousel */}
        <div className="flex-1 flex flex-col justify-center min-h-0">
           <div className="relative">
              <div className="flex gap-6 sm:gap-12 overflow-x-auto pb-16 pt-10 scrollbar-none no-scrollbar px-12 -mx-12 overscroll-x-contain">
                 {currentSystem?.games.map((game, i) => {
                   const isActive = i === activeGameIdx;
                   return (
                     <motion.div
                       key={game.id}
                       animate={{ 
                         scale: isActive ? 1.2 : 1,
                         y: isActive ? -10 : 0,
                         opacity: isActive ? 1 : 0.4,
                         zIndex: isActive ? 20 : 1
                       }}
                       whileHover={{ scale: isActive ? 1.25 : 1.05, opacity: 1 }}
                       className={`relative w-44 sm:w-[320px] lg:w-[400px] shrink-0 aspect-[2/3] rounded-2xl sm:rounded-[2.5rem] overflow-hidden cursor-pointer shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] transition-all ${
                         isActive ? "ring-4 sm:ring-8 ring-white" : "ring-1 ring-white/10"
                       }`}
                       onClick={() => {
                         setActiveGameIdx(i);
                         if (isActive) {
                           if (window.innerWidth < 1024) setShowMobileDetails(true);
                           else openGame(game);
                         }
                       }}
                       onMouseEnter={() => { if (window.innerWidth >= 1024) setActiveGameIdx(i); }}
                     >
                        {game.artUrl ? (
                          <img src={game.artUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                             <Gamepad2 className="size-16 sm:size-24 text-white/5" />
                          </div>
                        )}
                        {!isActive && <div className="absolute inset-0 bg-black/20" />}
                     </motion.div>
                   );
                 })}
              </div>
           </div>

           {/* Floating Info Plate */}
           <AnimatePresence mode="wait">
             {activeGame && (
               <motion.div
                 key={activeGame.id + "-meta"}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 20 }}
                 className="flex flex-col items-center text-center mt-6 sm:mt-12 space-y-3 sm:space-y-4 px-4"
               >
                  <h2 className="text-2xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-lg line-clamp-2">
                    {activeGame.title}
                  </h2>
                  <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2">
                     <div className="flex items-center gap-1.5 text-yellow-400 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        <Star className="size-4 sm:size-5 fill-current" />
                        <span className="text-sm sm:text-lg">{activeGame.rating || '-'}/5</span>
                     </div>
                     <div className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/60">{activeGame.year || '----'}</div>
                     <div className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/60 hidden sm:block">{activeGame.genre}</div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (window.innerWidth < 1024) setShowMobileDetails(true);
                      else {
                        const returnTo = encodeURIComponent(window.location.href);
                        window.location.href = apiUrl(`/api/roms/${activeGame.romId}/player?return=${returnTo}`);
                      }
                    }}
                    className="mt-4 sm:mt-8 h-12 sm:h-16 px-8 sm:px-12 rounded-xl sm:rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-xs sm:text-sm shadow-2xl flex items-center gap-3 hover:bg-neutral-100 transition-colors"
                  >
                    {window.innerWidth < 1024 ? "View Details" : "Play Software"} <ChevronRight className="size-4 sm:size-5" />
                  </motion.button>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* System Bar (Bottom) */}
        <div className="mt-auto pt-6 sm:pt-10 border-t border-white/10 flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none no-scrollbar overscroll-x-contain">
           {systemsWithGames.map((group, i) => (
             <button
               key={group.system.id}
               onClick={() => { setActiveSystemIdx(i); setActiveGameIdx(0); }}
               className={`px-6 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold uppercase tracking-widest transition-all whitespace-nowrap text-[10px] sm:text-xs ${
                 i === activeSystemIdx 
                   ? "bg-white text-black scale-105 shadow-xl" 
                   : "bg-white/5 text-white/40 hover:bg-white/10"
               }`}
             >
               {group.system.shortName}
             </button>
           ))}
        </div>
      </div>

      {/* Mobile Drawer (Only for Colorful) */}
      <AnimatePresence>
         {showMobileDetails && activeGame && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 top-20 bg-black/90 backdrop-blur-3xl z-[100] p-8 border-t border-white/10 flex flex-col gap-8 rounded-t-[2.5rem]"
            >
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={() => setShowMobileDetails(false)}
                 className="absolute top-4 right-4 text-white/40"
               >
                 <ChevronLeft className="size-6 rotate-270" />
               </Button>

               <div className="aspect-video rounded-3xl overflow-hidden border border-white/10 relative">
                  {activeGame.artUrl ? <img src={activeGame.artUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-neutral-900" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                     <h2 className="text-3xl font-black uppercase tracking-tighter italic">{activeGame.title}</h2>
                  </div>
               </div>

               <div className="flex-1 space-y-6 overflow-y-auto scrollbar-none">
                  <p className="text-lg text-white/60 leading-relaxed font-medium">{activeGame.description || "The definitive experience awaits."}</p>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1 text-center">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-white/30">Release</div>
                        <div className="font-bold">{activeGame.year || '----'}</div>
                     </div>
                     <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1 text-center">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-white/30">Rating</div>
                        <div className="font-bold text-yellow-400">{activeGame.rating || '-'}/5</div>
                     </div>
                  </div>
               </div>

               <Button 
                 onClick={() => {
                   const returnTo = encodeURIComponent(window.location.href);
                   window.location.href = apiUrl(`/api/roms/${activeGame.romId}/player?return=${returnTo}`);
                 }}
                 className="h-16 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-sm shadow-2xl"
               >
                  Play Game
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
