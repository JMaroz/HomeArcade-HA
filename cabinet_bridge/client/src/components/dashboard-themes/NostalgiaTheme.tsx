import React, { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { uploadedRomToGame, SYSTEMS, type Game } from "@/data/library";
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
  Clock, 
  Star,
  Info,
  ChevronRight
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

function fmtHoursShort(minutes: number) {
  const h = minutes / 60;
  if (h < 1) return `${minutes}m`;
  return `${h % 1 === 0 ? h : h.toFixed(1)}h`;
}

export default function NostalgiaTheme() {
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

  const recentlyPlayed = useMemo(
    () =>
      [...games]
        .filter((g) => g.lastPlayed && g.lastPlayed > 0)
        .sort((a, b) => (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0))
        .slice(0, 15),
    [games],
  );

  const [focus, setFocus] = useState({ shelf: recentlyPlayed.length > 0 ? -1 : 0, game: 0 });
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  const activeGame = useMemo(() => {
    if (focus.shelf === -1) return recentlyPlayed[focus.game];
    const shelf = systemsWithGames[focus.shelf];
    return shelf?.games[focus.game];
  }, [focus, recentlyPlayed, systemsWithGames]);

  // Navigation Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeGame || dialogGame) return;
      
      setFocus(prev => {
        let { shelf, game } = prev;
        const currentShelfGames = shelf === -1 ? recentlyPlayed : systemsWithGames[shelf].games;

        if (e.key === "ArrowRight") {
          game = Math.min(game + 1, currentShelfGames.length - 1);
        } else if (e.key === "ArrowLeft") {
          game = Math.max(game - 1, 0);
        } else if (e.key === "ArrowDown") {
          if (shelf < systemsWithGames.length - 1) {
            shelf++;
            const nextShelfGames = systemsWithGames[shelf].games;
            game = Math.min(game, nextShelfGames.length - 1);
          }
        } else if (e.key === "ArrowUp") {
          if (shelf > -1) {
            if (shelf === 0 && recentlyPlayed.length > 0) {
              shelf = -1;
              game = Math.min(game, recentlyPlayed.length - 1);
            } else if (shelf > 0) {
              shelf--;
              const nextShelfGames = systemsWithGames[shelf].games;
              game = Math.min(game, nextShelfGames.length - 1);
            }
          }
        } else if (e.key === "Enter") {
          if (window.innerWidth < 1024) setShowMobileDetails(true);
          else openGame(activeGame);
          return prev;
        } else {
          return prev;
        }

        return { shelf, game };
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeGame, recentlyPlayed, systemsWithGames, dialogGame]);

  const launchGame = (game: Game) => {
    if (game.romId) {
      const returnTo = encodeURIComponent(window.location.href);
      window.location.href = apiUrl(`/api/roms/${game.romId}/player?return=${returnTo}`);
    } else {
      openGame(game);
    }
  };

  return (
    <div className="fixed inset-0 lg:left-0 z-[50] bg-black text-white flex flex-col select-none overflow-hidden">
      <MobileTopBar />

      <AnimatePresence mode="wait">
        {activeGame && (
          <motion.div
            key={activeGame.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            {activeGame.artUrl ? (
              <img 
                src={activeGame.artUrl} 
                className="w-full h-full object-cover opacity-40 blur-[12px] scale-105" 
                alt="" 
              />
            ) : (
              <div 
                className="w-full h-full opacity-30"
                style={{ background: `radial-gradient(circle at 70% 30%, hsl(${activeGame.art[0]}), transparent 80%)` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-black" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full h-full flex flex-col lg:flex-row max-w-[1920px] mx-auto">
        
        {/* Left Side: Game Shelves */}
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden p-6 sm:p-12 pb-32 scrollbar-none space-y-10 sm:space-y-16">
          
          {recentlyPlayed.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-baseline gap-3">
                <h2 className="font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tighter italic">Jump Back In</h2>
                <span className="font-mono text-[9px] sm:text-[10px] text-white/30 tracking-[0.4em] uppercase hidden sm:inline">Recently Played</span>
              </div>
              <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-none no-scrollbar overscroll-x-contain">
                {recentlyPlayed.map((game, i) => {
                  const isActive = focus.shelf === -1 && i === focus.game;
                  return (
                    <motion.div
                      key={game.id}
                      onMouseEnter={() => { if (window.innerWidth >= 1024) setFocus({ shelf: -1, game: i }); }}
                      onClick={() => {
                        setFocus({ shelf: -1, game: i });
                        if (window.innerWidth < 1024) setShowMobileDetails(true);
                        else openGame(game);
                      }}
                      animate={{ scale: isActive ? 1.05 : 1 }}
                      className={`relative w-36 sm:w-48 shrink-0 aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                        isActive ? "ring-4 ring-white shadow-[0_0_40px_rgba(255,255,255,0.4)] z-10" : "ring-1 ring-white/10 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {game.artUrl ? <img src={game.artUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-neutral-900" />}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-50" />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {systemsWithGames.map((group, sIdx) => (
            <div key={group.system.id} className="space-y-4 sm:space-y-6">
              <div className="flex items-baseline gap-3">
                <h2 className="font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tighter italic">{group.system.name}</h2>
                <span className="font-mono text-[9px] sm:text-[10px] text-white/30 tracking-[0.4em] uppercase hidden sm:inline">{group.games.length} Titles</span>
              </div>
              <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-none no-scrollbar overscroll-x-contain">
                {group.games.map((game, i) => {
                  const isActive = focus.shelf === sIdx && i === focus.game;
                  return (
                    <motion.div
                      key={game.id}
                      onMouseEnter={() => { if (window.innerWidth >= 1024) setFocus({ shelf: sIdx, game: i }); }}
                      onClick={() => {
                        setFocus({ shelf: sIdx, game: i });
                        if (window.innerWidth < 1024) setShowMobileDetails(true);
                        else openGame(game);
                      }}
                      animate={{ scale: isActive ? 1.05 : 1 }}
                      className={`relative w-36 sm:w-48 shrink-0 aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                        isActive ? "ring-4 ring-white shadow-[0_0_40px_rgba(255,255,255,0.4)] z-10" : "ring-1 ring-white/10 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {game.artUrl ? <img src={game.artUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-neutral-900" />}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-50" />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

          {!roms.length && (
            <div className="flex flex-col items-center justify-center h-[50vh] opacity-50">
               <Info className="size-12 mb-4" />
               <p className="font-mono uppercase tracking-widest text-sm">Library Empty</p>
            </div>
          )}
        </div>

        {/* Right Side: Frosted Glass Info Panel (Fixed or Overlay) */}
        <AnimatePresence>
          {(activeGame && (window.innerWidth >= 1024 || showMobileDetails)) && (
            <motion.div 
              key={activeGame.id + "panel"}
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className={`fixed lg:relative right-0 top-16 bottom-0 lg:top-0 w-full sm:w-[400px] xl:w-[500px] shrink-0 border-l border-white/10 bg-black/70 lg:bg-black/40 backdrop-blur-3xl z-[100] flex flex-col ${!showMobileDetails && "hidden lg:flex"}`}
            >
              {/* Close for mobile overlay */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowMobileDetails(false)}
                className="absolute top-4 left-4 lg:hidden text-white/40 z-50"
              >
                <ChevronRight className="size-6 rotate-180" />
              </Button>

              <div className="relative w-full aspect-video border-b border-white/10 bg-black/20 overflow-hidden shrink-0">
                {activeGame.artUrl ? (
                  <img src={activeGame.artUrl} className="w-full h-full object-cover opacity-60" alt="" />
                ) : (
                  <div className="w-full h-full bg-neutral-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                <div className="absolute bottom-6 left-8 right-8">
                   <div className="font-mono text-[10px] text-primary uppercase tracking-[0.3em] font-bold mb-1">
                     {SYSTEMS.find(s => s.id === activeGame.system)?.name ?? activeGame.system}
                   </div>
                   <h2 className="font-display text-2xl lg:text-4xl font-black leading-none text-white uppercase tracking-tighter italic">
                     {activeGame.title}
                   </h2>
                </div>
              </div>

              <div className="p-8 lg:p-12 flex flex-col flex-1 overflow-y-auto scrollbar-none">
                <div className="flex items-center gap-4 mb-8">
                  {activeGame.year > 0 && (
                    <span className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px] font-black text-white/80 uppercase">
                      {activeGame.year}
                    </span>
                  )}
                  {activeGame.rating > 0 && (
                    <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/5 px-3 py-1.5 rounded-lg border border-yellow-500/10 font-mono text-xs font-black">
                       <Star className="size-4 fill-current" />
                       <span className="pt-0.5">{activeGame.rating}/5</span>
                    </div>
                  )}
                </div>

                <div className="text-base text-white/60 leading-relaxed line-clamp-8 mb-10 font-medium italic">
                  {activeGame.description || "The definitive retro gaming experience is ready for deployment. Finalizing initialization sequence..."}
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-10">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                     <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/20">Time Logged</div>
                     <div className="font-mono font-black text-2xl text-primary/80">{fmtHoursShort(activeGame.minutesPlayed ?? 0)}</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                     <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/20">Mission Status</div>
                     <div className="font-mono font-bold text-xs uppercase tracking-widest pt-2">
                        {activeGame.lastPlayed ? "Active" : "Unplayed"}
                     </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 flex flex-col gap-3">
                  <Button 
                    size="lg" 
                    onClick={() => launchGame(activeGame)}
                    className="w-full h-16 rounded-2xl bg-white hover:bg-neutral-200 text-black font-black uppercase tracking-[0.2em] text-sm shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-transform active:scale-95"
                  >
                    <Play className="size-5 mr-3 fill-current" /> Execute Sequence
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => openGame(activeGame)}
                    className="w-full h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-[0.1em] text-xs"
                  >
                    Technical Specs
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
      
      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
