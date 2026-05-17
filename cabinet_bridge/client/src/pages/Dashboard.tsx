import React, { useMemo, useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { uploadedRomToGame, SYSTEMS, type Game, type System } from "@/data/library";
import { GameCard } from "@/components/GameCard";
import { SystemTile } from "@/components/GameArt";
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
  Trophy, 
  ListTodo, 
  TrendingUp, 
  Star, 
  Zap, 
  History, 
  Radio, 
  Gamepad2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

// ─── animation variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmtHoursShort(minutes: number) {
  const h = minutes / 60;
  if (h < 1) return `${minutes}m`;
  return `${h % 1 === 0 ? h : h.toFixed(1)}h`;
}

// ─── sub-components ───────────────────────────────────────────────────────────
function SectionHeader({
  title,
  href,
  count,
}: {
  title: string;
  href?: string;
  count?: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
      <div className="flex items-center gap-3">
        {count !== undefined && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("dashboard.stats.gamesCount", { count })}
          </span>
        )}
        {href && (
          <Link
            href={href}
            className="font-mono text-[10px] uppercase tracking-wider text-primary hover:underline"
          >
            {t("common.ui.seeAll")} →
          </Link>
        )}
      </div>
    </div>
  );
}

function HorizontalShelf({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-6 -mx-1 px-1 scrollbar-none overscroll-x-contain">
      {children}
    </div>
  );
}

// ─── Console Carousel ─────────────────────────────────────────────────────────

function ConsoleCarousel({ 
  systems, 
  roms,
  onSelect 
}: { 
  systems: System[]; 
  roms: UploadedRom[];
  onSelect: (s: System) => void;
}) {
  const [index, setIndex] = useState(0);
  const { t } = useTranslation();
  
  // 3D Tilt Logic
  const mouseX = motion.useMotionValue(0);
  const mouseY = motion.useMotionValue(0);
  const rotateX = motion.useTransform(mouseY, [-200, 200], [10, -10]);
  const rotateY = motion.useTransform(mouseX, [-300, 300], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleNext = () => setIndex((i) => (i + 1) % systems.length);
  const handlePrev = () => setIndex((i) => (i - 1 + systems.length) % systems.length);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Enter") onSelect(systems[index]);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, systems]);

  const activeSystem = systems[index];
  const activeCount = roms.filter(r => r.system === activeSystem.id).length;

  return (
    <div 
      className="relative w-full py-8 sm:py-16 flex flex-col items-center gap-10 sm:gap-12 overflow-hidden min-h-[550px] sm:min-h-[650px] touch-none select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Glow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSystem.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, hsl(${activeSystem.art[0]}), transparent 75%)`,
          }}
        />
      </AnimatePresence>

      <div className="flex items-center gap-4 sm:gap-16 relative z-10 w-full justify-center px-6 sm:px-12">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handlePrev}
          className="size-14 rounded-full border border-white/10 bg-white/5 backdrop-blur hover:bg-white/20 transition-all shrink-0 hidden md:flex active:scale-90"
        >
          <ChevronLeft className="size-7" />
        </Button>

        {/* Swipeable Container */}
        <motion.div 
          className="flex items-center justify-center gap-6 sm:gap-12 perspective-[1200px] cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) handleNext();
            else if (info.offset.x > 60) handlePrev();
          }}
        >
          {[-1, 0, 1].map((offset) => {
            const idx = (index + offset + systems.length) % systems.length;
            const system = systems[idx];
            const isActive = offset === 0;

            return (
              <div key={system.id} className="relative group">
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 0.8,
                    opacity: isActive ? 1 : 0.3,
                    rotateY: isActive ? rotateY : offset * 35,
                    rotateX: isActive ? rotateX : 0,
                    x: isActive ? 0 : offset * 60,
                    z: isActive ? 100 : 0,
                    display: !isActive && window.innerWidth < 1024 ? "none" : "block"
                  }}
                  transition={{ type: "spring", stiffness: 260, damping: 25 }}
                  className={`relative w-[300px] sm:w-[400px] aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] transition-shadow ${
                    isActive ? "ring-4 ring-primary/80 shadow-primary/25" : ""
                  }`}
                  onClick={() => isActive ? onSelect(system) : setIndex(idx)}
                >
                  <SystemTile system={system} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-8 left-8 right-8">
                     <div className="font-display text-2xl font-bold text-white drop-shadow-xl tracking-tight">
                       {system.shortName}
                     </div>
                     <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                       {system.era}
                     </div>
                  </div>
                </motion.div>

                {/* Reflection Floor (Obsidian Floor) */}
                {isActive && (
                  <motion.div
                    animate={{
                      rotateY: rotateY,
                      rotateX: -rotateX,
                      scale: 1.15
                    }}
                    className="absolute top-full left-0 right-0 h-1/2 pointer-events-none opacity-25 blur-[2px]"
                    style={{
                      transformOrigin: "top center",
                      transform: "scaleY(-1) translateY(10px)",
                      maskImage: "linear-gradient(to bottom, black, transparent)",
                      WebkitMaskImage: "linear-gradient(to bottom, black, transparent)"
                    }}
                  >
                     <SystemTile system={system} />
                  </motion.div>
                )}
              </div>
            );
          })}
        </motion.div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNext}
          className="size-14 rounded-full border border-white/10 bg-white/5 backdrop-blur hover:bg-white/20 transition-all shrink-0 hidden md:flex active:scale-90"
        >
          <ChevronRight className="size-7" />
        </Button>
      </div>

      {/* Info HUD */}
      <motion.div 
        key={activeSystem.id + "-info"}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center space-y-3 z-10 px-8 mt-12 sm:mt-16"
      >
        <h1 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tighter text-neon leading-none filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          {activeSystem.name}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-muted-foreground font-mono text-xs sm:text-sm uppercase tracking-[0.2em]">
          <span className="flex items-center gap-2"><Clock className="size-3 text-primary" /> {activeSystem.era} Era</span>
          <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-border/40" />
          <span className="text-foreground font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10">
             {activeCount} {t("dashboard.stats.gamesCount", { count: activeCount }).split(" ")[1] || "Games"}
          </span>
        </div>
        <div className="pt-8">
          <Button 
            size="lg" 
            onClick={() => onSelect(activeSystem)}
            className="rounded-full px-12 h-14 sm:h-16 gap-3 bg-primary hover:bg-primary/90 text-white text-base font-black uppercase tracking-[0.15em] shadow-[0_20px_40px_-10px_rgba(var(--primary),0.4)] transition-all hover:scale-105 active:scale-95"
          >
            Explore Library <ChevronRight className="size-5" />
          </Button>
        </div>
      </motion.div>

      {/* Breadcrumb Indicator */}
      <div className="flex gap-2 z-10 pt-10 overflow-x-auto max-w-[85%] scrollbar-none px-6">
        {systems.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-500 shrink-0 ${
              i === index ? "w-10 bg-primary" : "w-2.5 bg-border/30 hover:bg-border/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}


// ─── main page ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { config } = useIntegration();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: roms = [] } = useQuery<UploadedRom[]>({ queryKey: ["/api/roms"] });
  const { data: sessions = [] } = useQuery<Array<{ id: number; romId: number; romTitle: string; romSystem: string; startedAt: number; endedAt: number | null; durationSeconds: number | null }>>({
    queryKey: ["/api/sessions"],
    staleTime: 30_000,
  });
  const { data: collections = [] } = useQuery<GameCollectionWithItems[]>({
    queryKey: ["/api/collections"],
  });

  const {
    selectedGame,
    openGame,
    closeGame,
    handleToggleFav,
    handleRate,
    handleCreateCollection,
    handleToggleCollection,
    handleSetStatus,
  } = useGameDialogState();

  const games = useMemo(() => roms.map(uploadedRomToGame), [roms]);

  // ── recently played ──
  const recentlyPlayed = useMemo(
    () =>
      [...games]
        .filter((g) => g.lastPlayed && g.lastPlayed > 0)
        .sort((a, b) => (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0))
        .slice(0, 8),
    [games],
  );

  const handleSystemSelect = (s: System) => {
    setLocation(`/library/${s.id}`);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20 lg:pb-0 overscroll-y-contain bg-background/20">
      <MobileTopBar />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1600px] mx-auto space-y-12"
      >
        {/* Main Hero: Console Carousel */}
        <motion.section variants={itemVariants} className="pt-8">
           <ConsoleCarousel 
             systems={SYSTEMS} 
             roms={roms} 
             onSelect={handleSystemSelect} 
           />
        </motion.section>

        <div className="px-5 sm:px-8 space-y-12 pb-12">
          {/* Quick Access Shelves */}
          {recentlyPlayed.length > 0 && (
            <motion.section variants={itemVariants} className="space-y-4">
              <SectionHeader
                title={t("dashboard.sections.recentlyPlayed")}
                href="/library/recent"
                count={recentlyPlayed.length}
              />
              <HorizontalShelf>
                {recentlyPlayed.map((g, i) => (
                  <div key={g.id} className="w-44 shrink-0">
                    <GameCard game={g} onOpen={openGame} onToggleFav={handleToggleFav} priority={i < 4} />
                  </div>
                ))}
              </HorizontalShelf>
            </motion.section>
          )}

          {/* Activity Feed & Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
             <motion.div variants={itemVariants} className="md:col-span-8 bg-card/30 backdrop-blur-md border border-border rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {t("dashboard.sections.recentActivity")}
                  </div>
                  <Link href="/history" className="text-[10px] font-mono uppercase text-primary hover:underline">
                    {t("common.ui.seeAll")} →
                  </Link>
                </div>
                <div className="divide-y divide-border/40">
                  {sessions.slice(0, 5).map((s) => {
                    const system = SYSTEMS.find((sys) => sys.id === s.romSystem);
                    const dur = s.durationSeconds
                      ? s.durationSeconds < 60
                        ? `${s.durationSeconds}s`
                        : `${Math.round(s.durationSeconds / 60)}m`
                      : null;
                    const when = formatRelative(s.startedAt);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-4 py-3 group cursor-pointer"
                        onClick={() => {
                          const g = games.find(game => game.romId === s.romId);
                          if (g) openGame(g);
                        }}
                      >
                        <div className="size-8 rounded bg-secondary/30 flex items-center justify-center shrink-0 group-hover:bg-secondary/50 transition-colors">
                          <History className="size-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">{s.romTitle}</div>
                          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground/60">
                            {config.showSystemLabels && (
                              <span className="uppercase tracking-wider">{system?.shortName ?? s.romSystem}</span>
                            )}
                            {dur && <span>· {dur}</span>}
                          </div>
                        </div>
                        <div className="shrink-0 font-mono text-[10px] text-muted-foreground/40">{when}</div>
                      </div>
                    );
                  })}
                </div>
             </motion.div>

             <motion.div variants={itemVariants} className="md:col-span-4 bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col justify-center text-center gap-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                  Library Health
                </div>
                <div className="space-y-1">
                   <div className="text-4xl font-display font-black text-foreground">{games.length}</div>
                   <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Total ROMs Verified</div>
                </div>
                <Link href="/settings">
                   <Button variant="outline" size="sm" className="w-full mt-4 font-mono text-[10px] uppercase tracking-wider gap-2">
                     <Info className="size-3.5" /> Check System Status
                   </Button>
                </Link>
             </motion.div>
          </div>
        </div>
      </motion.div>

      <GameDetailDialog
        game={selectedGame}
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
