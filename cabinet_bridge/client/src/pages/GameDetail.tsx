/**
 * GameDetail — full page at /game/:id (not a dialog overlay).
 * Implements the Neon Synth design from game_details_desktop_library reference.
 */
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { GameArt } from "@/components/GameArt";
import { Button } from "@/components/ui/button";
import { SYSTEMS, GAMES, type Game, uploadedRomToGame, gameLaunchEndpoint } from "@/data/library";
import { apiUrl, apiRequest, queryClient } from "@/lib/queryClient";
import { useIntegration } from "@/lib/integration";
import { useToast } from "@/hooks/use-toast";
import type { UploadedRom } from "@shared/schema";
import {
  Play,
  History,
  Clock,
  Calendar,
  Star,
  Gamepad2,
  Group,
  Settings,
  HelpCircle,
  ArrowLeft,
  ChevronLeft,
  X,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── helpers ────────────────────────────────────────────────────────────────
function formatPlayTime(minutes: number | null | undefined): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return m >= 45 ? `${h + 1}h` : m >= 15 ? `${h}½h` : `${h}h`;
}

// ── Desktop Sidebar Nav ─────────────────────────────────────────────────────
interface SidebarNavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}

function SidebarNavItem({ href, icon: Icon, label, active }: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
        active
          ? "bg-primary text-on-primary rounded-lg"
          : "text-on-surface-variant hover:bg-white/5"
      }`}
    >
      <Icon className="size-5" />
      <span className="text-sm">{label}</span>
    </Link>
  );
}

// ── Stats Card ───────────────────────────────────────────────────────────────
function StatsCard({
  label,
  value,
  icon: Icon,
  neonClass = "",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  neonClass?: string;
}) {
  return (
    <div className="glass-panel p-6 rounded-xl flex items-center justify-between group hover:neon-border-magenta transition-all">
      <div>
        <p className="font-label-caps text-label-caps text-on-surface-variant">{label}</p>
        <h3 className="text-headline-lg-mobile text-on-surface">{value}</h3>
      </div>
      <Icon className={`text-4xl opacity-50 ${neonClass}`} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface GameDetailProps {
  id?: string;
}

export default function GameDetail({ id }: GameDetailProps) {
  const { toast } = useToast();
  const { config } = useIntegration();
  const [scrapingArt, setScrapingArt] = useState(false);
  const [showWarp, setShowWarp] = useState(false);

  // ── Load game data ──────────────────────────────────────────────────────
  const { data: uploadedRoms = [] } = useQuery<UploadedRom[]>({
    queryKey: ["/api/roms"],
  });

  // Find the game by id — check uploaded ROMs first, then demo games
  const allGames: Game[] = [
    ...uploadedRoms.map(uploadedRomToGame),
    ...GAMES,
  ];

  const game = allGames.find((g) => g.id === id);

  const system = game ? SYSTEMS.find((s) => s.id === game.system) : null;

  const endpoint = game ? gameLaunchEndpoint(game) : null;

  // ── RetroAchievements ────────────────────────────────────────────────
  const { data: raProgress } = useQuery({
    queryKey: ["ra-progress", game?.raGameId],
    queryFn: async () => {
      if (!game?.raGameId) return null;
      const res = await fetch(apiUrl(`/api/retroachievements/user-progress/${game.raGameId}`));
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!game?.raGameId && !!config.raUsername && !!config.raToken,
  });

  // ── Launch ────────────────────────────────────────────────────────────
  const [launching, setLaunching] = useState(false);

  const launch = async () => {
    if (!game?.romId) return;
    setLaunching(true);
    const returnTo = encodeURIComponent(window.location.href);
    const playerUrl = apiUrl(`/api/roms/${game.romId}/player?return=${returnTo}`);
    try {
      const probe = await fetch(playerUrl, { method: "HEAD" });
      if (!probe.ok) {
        toast({
          title: "Couldn't launch game",
          description: probe.status === 404
            ? "ROM file not found on the server. It may have been deleted."
            : `Server returned ${probe.status}. Try restarting the HomeArcade add-on.`,
          variant: "destructive",
        });
        setLaunching(false);
        return;
      }
    } catch {
      toast({
        title: "Couldn't reach server",
        description: "HomeArcade server is not responding. Check that the add-on is running.",
        variant: "destructive",
      });
      setLaunching(false);
      return;
    }
    window.location.href = playerUrl;
  };

  const refreshArt = async () => {
    if (!game?.romId) return;
    setScrapingArt(true);
    try {
      const res = await apiRequest("POST", `/api/roms/${game.romId}/scrape-art`);
      const data = await res.json() as UploadedRom;
      await queryClient.invalidateQueries({ queryKey: ["/api/roms"] });
      if (data.artUrl) {
        toast({ title: "Art updated", description: "Cover art fetched successfully." });
      } else {
        toast({ title: "No art found", description: "ScreenScraper couldn't match this title.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Art refresh failed", description: String(err), variant: "destructive" });
    } finally {
      setScrapingArt(false);
    }
  };

  if (!game) {
    return (
      <div className="flex min-h-full">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col h-full py-6 bg-surface-container-low w-80 fixed left-0 top-0 z-50 border-r border-white/5">
          <SidebarBrand />
          <SidebarNav />
          <SidebarUser />
        </aside>

        {/* Content */}
        <main className="flex-1 md:ml-80 flex flex-col items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-headline-lg text-on-surface-variant mb-2">Game not found</p>
            <p className="text-body-md text-muted-foreground mb-6">
              No game with ID "{id}" exists in your library.
            </p>
            <Link href="/">
              <Button>
                <ArrowBack className="size-4" /> Back to Library
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const playTimeDisplay = formatPlayTime(game.minutesPlayed ?? 0);

  // Format last played
  const lastPlayedDisplay = game.lastPlayed
    ? new Date(game.lastPlayed).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const scoreDisplay =
    game.communityScore != null
      ? `${(game.communityScore / 2).toFixed(1)}/10`
      : null;

  const genrePills = game.genre
    ? game.genre.split(",").map((g) => g.trim()).filter(Boolean)
    : [];

  return (
    <div className="flex min-h-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-full py-6 bg-surface-container-low w-80 fixed left-0 top-0 z-50 border-r border-white/5">
        <SidebarBrand />
        <nav className="flex-1 space-y-1 px-2">
          <SidebarNavItem href="/" icon={Gamepad2} label="Library" />
          <SidebarNavItem href="/friends" icon={Group} label="Friends" />
          <SidebarNavItem href="/history" icon={History} label="History" />
          <SidebarNavItem href="/settings" icon={Settings} label="Settings" />
          <SidebarNavItem href="/support" icon={HelpCircle} label="Support" />
        </nav>
        <SidebarUser />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-80">
        {/* Hero Section */}
        <section className="relative w-full h-[500px] overflow-hidden">
          <div className="absolute inset-0">
            {game.artUrl ? (
              <img
                src={game.artUrl}
                alt={game.title}
                className="w-full h-full object-cover opacity-60"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, hsl(${game.art[0]}), hsl(${game.art[1]}))`,
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </div>

          {/* Back button */}
          <Link
            href="/"
            className="absolute top-6 left-6 z-10 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="size-6" />
            <span className="text-sm font-medium">Library</span>
          </Link>

          {/* Hero Content */}
          <div className="relative h-full flex flex-col justify-end px-margin-desktop pb-12 max-w-container-max mx-auto">
            <div className="flex flex-col gap-4">
              <span className="text-label-caps text-secondary-container tracking-widest uppercase">
                {system?.name ?? game.system}
              </span>
              <h1 className="text-headline-xl neon-glow-magenta text-primary">
                {game.title}
              </h1>
              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={launch}
                  disabled={launching || !game.romId}
                  className="bg-primary hover:bg-primary/80 text-on-primary px-8 py-4 rounded-lg font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 neon-border-magenta disabled:opacity-50"
                >
                  <Play className="size-5" style={{ fontVariationSettings: "'FILL' 1" }} />
                  {launching ? "Launching…" : "PLAY NOW"}
                </button>
                {game.romId && (
                  <button
                    onClick={launch}
                    className="glass-panel text-on-surface px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition-all"
                  >
                    RESUME
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="max-w-container-max mx-auto px-margin-desktop py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column (Main) */}
          <div className="lg:col-span-2 space-y-12">
            {/* About Section */}
            <section>
              <h2 className="text-headline-lg text-on-surface mb-6">About the Journey</h2>
              {game.description ? (
                <p className="text-body-md text-on-surface-variant leading-relaxed max-w-2xl">
                  {game.description}
                </p>
              ) : (
                <p className="text-body-md text-on-surface-variant leading-relaxed max-w-2xl">
                  No description available for this title.
                </p>
              )}
              {genrePills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {genrePills.map((g) => (
                    <span
                      key={g}
                      className="inline-flex items-center rounded-full border border-border bg-background/70 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Screenshots Gallery */}
            <section>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-headline-lg text-on-surface">Screenshots</h2>
                <span className="text-label-caps text-on-surface-variant cursor-pointer hover:text-primary">
                  VIEW ALL
                </span>
              </div>
              <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-4 -mx-2 px-2">
                {/* Placeholder screenshots — use artUrl or game images */}
                {[game.artUrl, game.artUrl, game.artUrl].map((src, i) => (
                  <div
                    key={i}
                    className="flex-none w-[400px] h-56 rounded-xl overflow-hidden glass-panel group cursor-pointer hover:neon-border-cyan transition-all"
                  >
                    {src ? (
                      <img
                        src={src}
                        alt={`Screenshot ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, hsl(${game.art[0]}), hsl(${game.art[1]}))`,
                        }}
                      >
                        <span className="text-white/20 text-sm font-mono uppercase">Screenshot {i + 1}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column (Sidebar/Details) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4">
              <StatsCard
                label="Time Played"
                value={playTimeDisplay}
                icon={Schedule}
                neonClass="text-primary"
              />
              {raProgress && raProgress.NumAchievements > 0 ? (
                <div className="glass-panel p-6 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-label-caps text-on-surface-variant">Achievements</p>
                    <span className="text-label-sm font-label-sm text-primary">
                      {raProgress.NumAwarded} / {raProgress.NumAchievements}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-tertiary-container shadow-[0_0_10px_rgba(255,0,255,0.5)]"
                      style={{
                        width: `${(raProgress.NumAwarded / raProgress.NumAchievements) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <StatsCard
                  label="Last Played"
                  value={lastPlayedDisplay}
                  icon={Event}
                  neonClass="text-secondary"
                />
              )}
            </div>

            {/* Legacy Rank */}
            <div className="glass-panel p-6 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Star className="size-5" style={{ fontVariationSettings: "'FILL' 1" }} />
                </div>
                <div>
                  <p className="text-label-caps text-primary">Legacy Rank</p>
                  <h3 className="text-headline-lg-mobile text-on-surface">
                    {game.rating ? `${"★".repeat(game.rating)} Master` : "Newcomer"}
                  </h3>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="glass-panel p-6 rounded-xl space-y-4">
              <h4 className="text-label-caps text-on-surface border-b border-white/10 pb-2">
                Specifications
              </h4>
              <div className="space-y-3">
                {game.developer && (
                  <div className="flex justify-between">
                    <span className="text-body-md text-on-surface-variant">Developer</span>
                    <span className="text-body-md text-on-surface">{game.developer}</span>
                  </div>
                )}
                {game.publisher && (
                  <div className="flex justify-between">
                    <span className="text-body-md text-on-surface-variant">Publisher</span>
                    <span className="text-body-md text-on-surface">{game.publisher}</span>
                  </div>
                )}
                {game.year && game.year > 0 && (
                  <div className="flex justify-between">
                    <span className="text-body-md text-on-surface-variant">Year</span>
                    <span className="text-body-md text-on-surface">{game.year}</span>
                  </div>
                )}
                {scoreDisplay && (
                  <div className="flex justify-between">
                    <span className="text-body-md text-on-surface-variant">Community Score</span>
                    <span className="text-body-md text-on-surface">{scoreDisplay}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Refresh Art */}
            {game.romId && (
              <button
                onClick={refreshArt}
                disabled={scrapingArt}
                className="w-full flex items-center justify-center gap-2 glass-panel p-4 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all disabled:opacity-40"
              >
                {scrapingArt ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
                <span className="text-sm font-medium">
                  {scrapingArt ? "Refreshing…" : "Refresh Cover Art"}
                </span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 py-3 bg-surface-container/80 backdrop-blur-xl border-t border-white/10">
        <Link href="/" className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-white/5 transition-colors">
          <Gamepad2 className="size-5" />
          <span className="text-label-sm">Library</span>
        </Link>
        <Link href="/friends" className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-white/5 transition-colors">
          <Group className="size-5" />
          <span className="text-label-sm">Friends</span>
        </Link>
        <Link href="/history" className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-white/5 transition-colors">
          <History className="size-5" />
          <span className="text-label-sm">History</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-white/5 transition-colors">
          <Settings className="size-5" />
          <span className="text-label-sm">Settings</span>
        </Link>
      </nav>
    </div>
  );
}

// ── Sidebar sub-components ──────────────────────────────────────────────────
function SidebarBrand() {
  return (
    <div className="px-6 mb-8 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
        <Gamepad2 className="text-on-primary size-5" />
      </div>
      <span className="text-headline-lg font-bold text-primary">HomeArcade</span>
    </div>
  );
}

function SidebarNav() {
  return (
    <nav className="flex-1 space-y-1 px-2">
      <SidebarNavItem href="/" icon={Gamepad2} label="Library" />
      <SidebarNavItem href="/friends" icon={Group} label="Friends" />
      <SidebarNavItem href="/history" icon={History} label="History" />
      <SidebarNavItem href="/settings" icon={Settings} label="Settings" />
      <SidebarNavItem href="/support" icon={HelpCircle} label="Support" />
    </nav>
  );
}

function SidebarUser() {
  return (
    <div className="px-4 mt-auto">
      <div className="flex items-center gap-4 p-4 rounded-xl glass-panel">
        <img
          alt="Player One"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDITq9XgXrK7vLz3wLGYsMNdHqSzS_Q3BadsLhv417EA9W7A5gz4AmYgbudeSdFMzItSKbSraMIdpRra-hM7StslSn5TD3mnVa8qPTJiba2eG6gc9frmpllvsTEXY6kqi0SCfL35zyChzEVBFoaXFZoAZMljZj8vlfOf4eWb4XthVDDtAJrhUqPYTVJ9sDAC2NXEUceToOBv84PsuhPno1zszO02Z8PZbo2Z2yVwSd7lY3moS1wV6Uh7YleyswdxkncPlHxRrE9Rg"
          className="w-12 h-12 rounded-full border-2 border-primary/50 object-cover"
        />
        <div>
          <p className="font-bold text-on-surface">Player One</p>
          <p className="text-xs text-on-surface-variant">Level 42 Master</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-[10px] text-green-400 font-label-sm">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}