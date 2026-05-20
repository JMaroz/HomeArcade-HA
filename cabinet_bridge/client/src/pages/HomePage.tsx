/**
 * HomePage — Desktop arcade library layout matching home_desktop_arcade_library reference.
 * - Sticky header with search
 * - Platforms carousel
 * - Game grid
 * - Recently Played strip
 */
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { uploadedRomToGame, GAMES, SYSTEMS } from "@/data/library";
import { GameCardSkeleton } from "@/components/GameCardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/lib/queryClient";
import type { UploadedRom } from "@shared/schema";
import {
  Search,
  Settings,
  LayoutGrid,
  List,
  Plus,
  Gamepad,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion } from "framer-motion";

function fmtHoursShort(minutes: number) {
  const h = minutes / 60;
  if (h < 1) return `${minutes}m`;
  return `${h % 1 === 0 ? h : h.toFixed(1)}h`;
}

export default function HomePage() {
  const { data: roms = [] } = useQuery<UploadedRom[]>({ queryKey: ["/api/roms"] });

  const allGames = useMemo(() => {
    const uploaded = roms.map(uploadedRomToGame);
    return [...uploaded, ...GAMES];
  }, [roms]);

  const recentlyPlayed = useMemo(
    () =>
      [...allGames]
        .filter((g) => g.lastPlayed && g.lastPlayed > 0)
        .sort((a, b) => (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0))
        .slice(0, 8),
    [allGames],
  );

  const [recentlyCollapsed, setRecentlyCollapsed] = useState(false);

  const handlePlayGame = (game: (typeof allGames)[0]) => {
    if (game.romId) {
      const returnTo = encodeURIComponent(window.location.href);
      window.location.href = apiUrl(`/api/roms/${game.romId}/player?return=${returnTo}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 lg:px-12 h-16 bg-background/80 backdrop-blur-xl border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative w-full group">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors pointer-events-none" />
            <Input
              type="search"
              placeholder="Search your library..."
              className="w-full pl-9 pr-4 h-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <button className="p-3 text-white/30 hover:text-white transition-colors">
              <Settings className="size-4" />
            </button>
          </Link>
          <div className="h-6 w-px bg-white/10" />
          <Button className="h-9 bg-primary text-on-primary rounded-lg font-bold text-xs uppercase tracking-wider px-4">
            <Plus className="size-3.5 mr-2" />
            Add Game
          </Button>
        </div>
      </div>

      <div className="flex-1 px-6 lg:px-12 py-8 space-y-8 pb-24 lg:pb-12">
        {/* Platforms / Browse by System */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-black text-white">Platforms</h2>
            <button className="text-xs font-mono uppercase tracking-widest text-primary/60 hover:text-primary transition-colors">
              View All
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {SYSTEMS.filter((s) => {
              return allGames.some((g) => g.system === s.id);
            })
              .slice(0, 5)
              .map((system) => {
                const count = allGames.filter((g) => g.system === system.id).length;
                return (
                  <button
                    key={system.id}
                    type="button"
                    onClick={() => {}}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/30 hover:scale-105 transition-all group"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, hsl(${system.art[0]}) 0%, hsl(${system.art[1]}) 100%)`,
                      }}
                    >
                      {system.image ? (
                        <img
                          src={system.image.url}
                          alt=""
                          className="w-full h-full object-cover rounded-full opacity-80"
                        />
                      ) : (
                        <span className="font-black text-lg text-white/60">{system.mono}</span>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="font-display text-xs font-black uppercase text-white">{system.shortName}</div>
                      <div className="font-mono text-[10px] text-white/30">{count} titles</div>
                    </div>
                  </button>
                );
              })}
          </div>
        </section>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => setRecentlyCollapsed((v) => !v)}
              className="flex items-center justify-between w-full mb-4 group"
            >
              <h2 className="font-display text-lg font-black text-white">Recently Played</h2>
              {recentlyCollapsed ? (
                <ChevronDown className="size-4 text-white/30" />
              ) : (
                <ChevronUp className="size-4 text-white/30" />
              )}
            </button>
            {!recentlyCollapsed && (
              <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
                {recentlyPlayed.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => handlePlayGame(game)}
                    className="shrink-0 w-28 aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900/50 group flex flex-col items-center hover:scale-105 transition-all"
                  >
                    <div className="relative w-full h-full flex-1">
                      {game.artUrl ? (
                        <img src={game.artUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{
                            background: `linear-gradient(135deg, hsl(${game.art[0]}), hsl(${game.art[1]}))`,
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="w-full bg-white/5 px-1.5 py-1 text-center">
                      <div className="text-[11px] font-bold truncate text-white/80 leading-tight">{game.title}</div>
                      <div className="text-[8px] text-white/30 uppercase">{game.system.toUpperCase()}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Game Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-lg font-black text-white">Your Collection</h2>
              <span className="text-xs font-mono text-white/30">({allGames.length} Games)</span>
            </div>
            <div className="flex gap-1">
              <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-primary">
                <LayoutGrid className="size-4" />
              </button>
              <button className="p-2 rounded-lg text-white/30 hover:text-white transition-colors">
                <List className="size-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {allGames.map((game) => (
              <motion.button
                key={game.id}
                type="button"
                whileHover={{ scale: 1.05, y: -4 }}
                onClick={() => handlePlayGame(game)}
                className="relative aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900 cursor-pointer group transition-all duration-300 ring-1 ring-white/10 hover:ring-primary/40 hover:shadow-[0_0_20px_rgba(255,171,243,0.15)]"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {game.artUrl ? (
                    <img src={game.artUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-[10px] font-black uppercase text-white/20 px-2 text-center leading-tight">
                      {game.title}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-[11px] font-bold truncate text-white leading-tight">{game.title}</div>
                  <div className="text-[9px] text-white/50 uppercase">{game.system.toUpperCase()}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}