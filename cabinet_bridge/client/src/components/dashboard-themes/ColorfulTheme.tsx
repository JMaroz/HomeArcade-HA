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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

// ─── helpers ──────────────────────────────────────────────────────────────────
function getSystemColor(systemId: string): string {
  const s = SYSTEMS.find(sys => sys.id === systemId);
  if (!s) return "220 100% 50%"; // Default blue
  return s.art[0]; // Primary brand color
}

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
        openGame(activeGame);
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
          {/* Subtle noise/texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex-1 flex flex-col p-6 sm:p-12 lg:p-20">
        
        {/* Header: Simplified Logo + System Name */}
        <div className="flex items-baseline gap-6 mb-12 sm:mb-20">
           <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter italic">Colorful</h1>
           <div className="h-10 w-px bg-white/20 hidden sm:block" />
           <div className="text-xl sm:text-3xl font-bold text-white/40 uppercase tracking-widest truncate">
              {currentSystem?.system.name || "Select System"}
           </div>
        </div>

        {/* Content Section: Giant Carousel */}
        <div className="flex-1 flex flex-col justify-center min-h-0">
           <div className="relative">
              <div className="flex gap-8 sm:gap-12 overflow-x-auto pb-16 pt-10 scrollbar-none no-scrollbar px-12 -mx-12">
                 {currentSystem?.games.map((game, i) => {
                   const isActive = i === activeGameIdx;
                   return (
                     <motion.div
                       key={game.id}
                       animate={{ 
                         scale: isActive ? 1.25 : 1,
                         y: isActive ? -20 : 0,
                         opacity: isActive ? 1 : 0.4,
                         zIndex: isActive ? 20 : 1
                       }}
                       whileHover={{ scale: isActive ? 1.3 : 1.05, opacity: 1 }}
                       className={`relative w-[240px] sm:w-[320px] lg:w-[400px] shrink-0 aspect-[2/3] rounded-[2rem] overflow-hidden cursor-pointer shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] transition-all ${
                         isActive ? "ring-8 ring-white" : "ring-1 ring-white/10"
                       }`}
                       onClick={() => {
                         setActiveGameIdx(i);
                         if (isActive) openGame(game);
                       }}
                       onMouseEnter={() => setActiveGameIdx(i)}
                     >
                        {game.artUrl ? (
                          <img src={game.artUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                             <Gamepad2 className="size-24 text-white/5" />
                          </div>
                        )}
                        {/* Overlay to darken slightly if not active */}
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
                 className="flex flex-col items-center text-center mt-12 space-y-4"
               >
                  <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-lg">
                    {activeGame.title}
                  </h2>
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                        <Star className="size-5 fill-current" />
                        <span className="text-lg">{activeGame.rating || '-'}/5</span>
                     </div>
                     <div className="h-4 w-px bg-white/20" />
                     <div className="text-sm font-bold uppercase tracking-widest text-white/60">{activeGame.year || '----'}</div>
                     <div className="h-4 w-px bg-white/20" />
                     <div className="text-sm font-bold uppercase tracking-widest text-white/60">{activeGame.genre}</div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const returnTo = encodeURIComponent(window.location.href);
                      window.location.href = apiUrl(`/api/roms/${activeGame.romId}/player?return=${returnTo}`);
                    }}
                    className="mt-8 h-16 px-12 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-sm shadow-2xl flex items-center gap-3 hover:bg-neutral-100 transition-colors"
                  >
                    Play Software <ChevronRight className="size-5" />
                  </motion.button>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* System Bar (Bottom) */}
        <div className="mt-auto pt-10 border-t border-white/10 flex gap-4 overflow-x-auto scrollbar-none no-scrollbar">
           {systemsWithGames.map((group, i) => (
             <button
               key={group.system.id}
               onClick={() => { setActiveSystemIdx(i); setActiveGameIdx(0); }}
               className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest transition-all ${
                 i === activeSystemIdx 
                   ? "bg-white text-black scale-110 shadow-xl" 
                   : "bg-white/5 text-white/40 hover:bg-white/10"
               }`}
             >
               {group.system.shortName}
             </button>
           ))}
        </div>
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
