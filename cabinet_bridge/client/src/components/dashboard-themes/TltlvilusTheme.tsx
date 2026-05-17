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
  ChevronLeft,
  Calendar,
  Layers,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

export default function TltlvilusTheme() {
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

  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll list
  useEffect(() => {
    if (view === "games") {
      const activeEl = listRef.current?.querySelector(`[data-index="${activeGameIdx}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeGameIdx, view]);

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
          e.preventDefault();
          setActiveGameIdx(i => Math.min(i + 1, (currentSystem?.games.length || 1) - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveGameIdx(i => Math.max(i - 1, 0));
        } else if (e.key === "ArrowLeft" || e.key === "Escape") {
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

  const accentColor = `hsl(${currentSystem?.system.art[0] || '0 0% 100%'})`;

  return (
    <div className="fixed inset-0 lg:left-0 z-[50] bg-[#0c0c0c] text-white flex flex-col select-none overflow-hidden font-sans">
      <MobileTopBar />

      <AnimatePresence mode="wait">
        {view === "systems" ? (
          <motion.div
            key="systems"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 sm:p-20 relative overflow-hidden"
          >
             {/* Background Silhouettes - Signature TLTL VILUS look */}
             <div className="absolute inset-0 z-0 opacity-5 pointer-events-none flex items-center justify-center scale-150 grayscale blur-sm">
                <Gamepad2 className="size-[80vh]" />
             </div>

             <div className="relative z-10 w-full max-w-6xl flex flex-col items-center gap-12">
                <div className="flex gap-8 sm:gap-16 items-center justify-center overflow-visible">
                   {[-1, 0, 1].map((offset) => {
                     const idx = (activeSystemIdx + offset + systemsWithGames.length) % systemsWithGames.length;
                     const group = systemsWithGames[idx];
                     const isActive = offset === 0;
                     return (
                       <motion.button
                         key={group.system.id}
                         onClick={() => { setActiveSystemIdx(idx); if (isActive) setView("games"); }}
                         animate={{ 
                           scale: isActive ? 1.2 : 0.7,
                           opacity: isActive ? 1 : 0.3,
                           x: offset * 40
                         }}
                         className={`relative flex flex-col items-center gap-6 ${isActive ? "z-20" : "z-10"}`}
                       >
                          <div 
                            className="size-48 sm:size-64 rounded-3xl flex items-center justify-center p-10 transition-all"
                            style={{ 
                              background: isActive ? accentColor : 'rgba(255,255,255,0.05)',
                              boxShadow: isActive ? `0 0 60px ${accentColor}44` : 'none'
                            }}
                          >
                             <Gamepad2 className={`size-full ${isActive ? "text-black" : "text-white/20"}`} />
                          </div>
                          {isActive && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-center"
                            >
                               <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter italic">
                                  {group.system.name}
                               </h1>
                               <div className="mt-2 text-white/40 font-mono text-[10px] uppercase tracking-[0.4em]">
                                  {group.games.length} Entries
                               </div>
                            </motion.div>
                          )}
                       </motion.button>
                     );
                   })}
                </div>
                
                <div className="flex gap-2 mt-8">
                   {systemsWithGames.map((_, i) => (
                     <div key={i} className={`h-1 rounded-full transition-all ${i === activeSystemIdx ? "w-8 bg-white" : "w-2 bg-white/10"}`} />
                   ))}
                </div>
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
             {/* Left: Minimal Game List */}
             <div 
               ref={listRef}
               className="w-full sm:w-80 lg:w-[400px] h-full border-r border-white/5 bg-[#0f0f0f] flex flex-col shrink-0 overflow-hidden"
             >
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView("systems")}>
                      <ChevronLeft className="size-5 text-white/30 group-hover:text-white transition-colors" />
                      <span className="font-display font-black uppercase tracking-tighter italic text-white/80 group-hover:text-white">{currentSystem.system.shortName}</span>
                   </div>
                   <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{currentSystem.games.length}</div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-none no-scrollbar py-4">
                   {currentSystem?.games.map((game, i) => {
                     const isActive = i === activeGameIdx;
                     return (
                       <button
                         key={game.id}
                         data-index={i}
                         onMouseEnter={() => { if (window.innerWidth >= 1024) setActiveGameIdx(i); }}
                         onClick={() => {
                            setActiveGameIdx(i);
                            if (window.innerWidth < 1024) setShowMobileDetails(true);
                            else openGame(game);
                         }}
                         className={`w-full text-left px-8 py-4 transition-all border-l-4 ${
                           isActive ? "bg-white/5 border-white text-white font-bold" : "border-transparent text-white/30 hover:text-white/60 hover:bg-white/[0.02]"
                         }`}
                       >
                          <div className="text-xs sm:text-sm uppercase tracking-wide truncate">{game.title}</div>
                       </button>
                     );
                   })}
                </div>
             </div>

             {/* Right: Modern Metadata Stage */}
             <div className="flex-1 h-full relative overflow-hidden bg-black flex flex-col lg:flex-row p-8 lg:p-16 gap-12">
                <AnimatePresence mode="wait">
                   {activeGame && (
                     <motion.div
                       key={activeGame.id}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -20 }}
                       transition={{ duration: 0.3 }}
                       className="flex-1 flex flex-col lg:flex-row gap-12 items-center lg:items-start"
                     >
                        {/* Artwork */}
                        <div className="w-full lg:w-[500px] shrink-0">
                           <div 
                             className="aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative bg-[#0f0f0f]"
                             style={{ boxShadow: `0 30px 100px -15px ${accentColor}22` }}
                           >
                              {activeGame.artUrl ? (
                                <img src={activeGame.artUrl} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/5">
                                   <Gamepad2 className="size-32" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                              
                              {/* Selection Indicator Corner */}
                              <div className="absolute top-6 left-6 flex items-center gap-3">
                                 <div className="size-3 rounded-full animate-pulse" style={{ background: accentColor }} />
                                 <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">Active Sequence</span>
                              </div>
                           </div>
                        </div>

                        {/* Text Metadata */}
                        <div className="flex-1 space-y-8 min-w-0 flex flex-col justify-center h-full">
                           <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                 <div className="px-4 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-widest text-white/40">{activeGame.year || '----'}</div>
                                 <div className="px-4 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-widest font-bold" style={{ color: accentColor }}>{activeGame.genre}</div>
                              </div>
                              <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter leading-none text-white drop-shadow-2xl">
                                 {activeGame.title}
                              </h2>
                              <div className="flex items-center gap-2 text-yellow-500">
                                 {[...Array(5)].map((_, i) => (
                                   <Star key={i} className={`size-4 ${i < (activeGame.rating || 0) ? "fill-current" : "opacity-20"}`} />
                                 ))}
                                 <span className="ml-2 font-mono text-xs font-bold text-white/40">{activeGame.rating || '0'}/5</span>
                              </div>
                           </div>

                           <div className="relative">
                              <div className="absolute -left-6 top-0 bottom-0 w-1 bg-white/5" />
                              <p className="text-lg text-white/40 leading-relaxed font-medium line-clamp-5 italic">
                                 {activeGame.description || "Sector analysis incomplete. Software integrity verified. Prepared for local execution sequence."}
                              </p>
                           </div>

                           <div className="pt-8 flex flex-col sm:flex-row gap-4">
                              <Button 
                                onClick={() => {
                                  const returnTo = encodeURIComponent(window.location.href);
                                  window.location.href = apiUrl(`/api/roms/${activeGame.romId}/player?return=${returnTo}`);
                                }}
                                className="h-16 px-12 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-neutral-200 shadow-2xl transition-all active:scale-95 shrink-0"
                              >
                                 Play
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => openGame(activeGame)}
                                className="h-16 px-8 rounded-2xl border-white/10 bg-white/5 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10"
                              >
                                 Technical Data
                              </Button>
                           </div>
                        </div>
                     </motion.div>
                   )}
                </AnimatePresence>

                {!activeGame && (
                   <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                      <Gamepad2 className="size-48" />
                   </div>
                )}
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
              className="fixed inset-x-0 bottom-0 top-20 bg-[#0f0f0f] z-[100] p-8 border-t border-white/10 flex flex-col gap-8 rounded-t-[3rem] shadow-2xl"
            >
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={() => setShowMobileDetails(false)}
                 className="absolute top-6 right-6 text-white/20"
               >
                 <ChevronLeft className="size-6 rotate-270" />
               </Button>

               <div className="aspect-video rounded-[2rem] overflow-hidden border border-white/5 relative">
                  {activeGame.artUrl ? <img src={activeGame.artUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-neutral-900" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                  <div className="absolute bottom-6 left-8 right-8">
                     <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{activeGame.title}</h2>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto scrollbar-none no-scrollbar space-y-6">
                  <div className="flex gap-4">
                     <div className="px-4 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-widest font-bold" style={{ color: accentColor }}>{activeGame.genre}</div>
                     <div className="px-4 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-widest text-white/40">{activeGame.year}</div>
                  </div>
                  <p className="text-lg text-white/30 leading-relaxed font-medium italic">{activeGame.description || "The art of retro playback."}</p>
               </div>

               <Button 
                 onClick={() => {
                   const returnTo = encodeURIComponent(window.location.href);
                   window.location.href = apiUrl(`/api/roms/${activeGame.romId}/player?return=${returnTo}`);
                 }}
                 className="h-16 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-sm shadow-xl active:scale-95 transition-transform"
               >
                  Initialize
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
