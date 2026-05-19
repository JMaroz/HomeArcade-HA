import React, { useMemo, useState, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import { useQuery } from "@tanstack/react-query";
import { uploadedRomToGame, GAMES, SYSTEMS, type Game, type System } from "@/data/library";
import { MobileTopBar } from "@/components/MobileNav";
import { apiUrl } from "@/lib/queryClient";
import { useIntegration } from "@/lib/integration";
import { useGameDialogState } from "@/lib/useGameDialogState";
import type { UploadedRom, GameCollectionWithItems } from "@shared/schema";
import { Search, LayoutGrid, X, Star, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useGridNav } from "@/lib/useGridNav";

export default function NesTheme() {
  const { config } = useIntegration();
  const { t } = useTranslation();
  const { data: roms = [] } = useQuery<UploadedRom[]>({ queryKey: ["/api/roms"] });
  
  const allGames = useMemo(() => [...roms.map(uploadedRomToGame), ...GAMES], [roms]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "title" | "year">("recent");
  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const [showMobileDetails, setShowMobileDetails] = useState(false);

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
    disabled: (window.innerWidth < 1280 && showMobileDetails),
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

  return (
    <div className="fixed inset-0 z-[50] bg-white text-black flex flex-col select-none overflow-hidden font-pixel p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="shrink-0">
        <MobileTopBar />
      </div>
      
      {/* NES Title Bar */}
      <div className="nes-container with-title is-centered mb-8 bg-white border-4 border-black">
        <p className="title text-xs uppercase tracking-widest bg-white px-2">HomeArcade 8-Bit</p>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex gap-4">
             <Link href="/history" className="nes-btn is-primary is-small">History</Link>
             <Link href="/settings" className="nes-btn is-success is-small">Settings</Link>
           </div>
           <div className="text-[10px] uppercase font-bold">
             {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 gap-8">
        
        {/* Systems Section */}
        <div className="nes-container with-title is-rounded bg-white border-4 border-black">
          <p className="title text-[10px] uppercase bg-white px-2">Console Select</p>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {SYSTEMS.filter(s => allGames.some(g => g.system === s.id)).map(system => (
              <button
                key={system.id}
                onClick={() => setSearchQuery("filter:" + system.id)}
                className={`nes-btn shrink-0 ${searchQuery === "filter:"+system.id ? "is-primary" : ""}`}
                style={{ minWidth: "140px" }}
              >
                <div className="flex flex-col items-center gap-2">
                   <div className="size-10">
                     {system.image ? (
                       <img src={system.image.url} className="size-full object-contain pixel-rendering" alt="" />
                     ) : (
                       <span className="text-[8px]">{system.mono}</span>
                     )}
                   </div>
                   <span className="text-[8px] uppercase">{system.shortName}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="nes-field">
          <label htmlFor="search_field" className="text-[10px] uppercase font-bold mb-2 block text-black/50">Search Database</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              id="search_field" 
              className="nes-input is-success !text-[10px] font-pixel h-12" 
              placeholder="ENTER TITLE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Main Grid & Details */}
        <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
          
          {/* Game List */}
          <div className="flex-1 nes-container with-title is-rounded bg-white border-4 border-black min-h-0 flex flex-col">
            <p className="title text-[10px] uppercase bg-white px-2">Software List</p>
            <div 
              ref={gridRef}
              className="flex-1 overflow-y-auto pr-2 grid gap-6 grid-cols-[repeat(auto-fill,minmax(120px,1fr))]"
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
                    className={`cursor-pointer transition-transform duration-75 active:scale-95`}
                  >
                    <div className={`h-full nes-container is-rounded p-2 border-4 border-black flex flex-col gap-2 ${isActive ? "bg-[#209cee] text-white" : "bg-white hover:bg-[#f0f0f0]"}`}>
                      <div className="aspect-[3/4] bg-black flex items-center justify-center overflow-hidden border-2 border-black">
                        {game.artUrl ? (
                          <img src={game.artUrl} className="w-full h-full object-cover pixel-rendering" alt="" />
                        ) : (
                          <div className="text-[6px] text-center text-white/50">{game.title}</div>
                        )}
                      </div>
                      <div className="text-[7px] uppercase font-bold truncate leading-tight">{game.title}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Window */}
          <AnimatePresence>
            {(activeGame && (window.innerWidth >= 1280 || showMobileDetails)) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-4 sm:inset-auto sm:right-8 sm:top-24 sm:bottom-8 sm:w-[450px] z-[60] flex flex-col"
              >
                <div className="nes-container with-title is-rounded bg-white border-4 border-black h-full flex flex-col shadow-2xl">
                  <p className="title text-[10px] uppercase bg-white px-2">Game Info</p>
                  
                  <div className="flex justify-end mb-4 lg:hidden">
                    <button onClick={() => setShowMobileDetails(false)} className="nes-btn is-error is-small">X</button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    <div className="aspect-video bg-black border-4 border-black overflow-hidden flex items-center justify-center">
                      {activeGame.artUrl ? (
                         <img src={activeGame.artUrl} className="w-full h-full object-cover pixel-rendering" alt="" />
                      ) : (
                         <div className="text-[10px] text-white/20">NO SIGNAL</div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-[12px] uppercase font-bold leading-relaxed">{activeGame.title}</h2>
                      <div className="nes-badge">
                        <span className="is-dark text-[8px] uppercase">{activeGame.system}</span>
                      </div>
                      
                      <div className="nes-container is-dark with-title border-4 border-white p-4">
                        <p className="title text-[8px] uppercase bg-black px-2">Description</p>
                        <p className="text-[10px] leading-relaxed text-white/70">
                          {activeGame.description || "NO DATA FOUND ON CARTRIDGE."}
                        </p>
                      </div>

                      <div className="space-y-4">
                         <div className="flex flex-col gap-2">
                           <span className="text-[8px] uppercase font-bold text-black/50">Current Progress</span>
                           <progress className="nes-progress is-success w-full h-6" value={activeGame.minutesPlayed || 0} max="1000"></progress>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t-4 border-black flex flex-col gap-4">
                    <button
                      onClick={() => {
                        const returnTo = encodeURIComponent(window.location.href);
                        window.location.href = apiUrl(`/api/roms/${activeGame.romId}/player?return=${returnTo}`);
                      }}
                      className="nes-btn is-primary w-full py-4 text-[12px] uppercase font-bold"
                    >
                      Start Game
                    </button>
                    <div className="flex gap-2">
                      <button className={`nes-btn flex-1 ${activeGame.favorite ? "is-warning" : ""}`}>
                        <Star className="size-4 inline-block mr-2" />
                      </button>
                      <button className="nes-btn flex-1 is-success">
                        <LayoutGrid className="size-4 inline-block" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .font-pixel { font-family: 'Press Start 2P', cursive; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
