import React, { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GameArt } from "@/components/GameArt";
import { WarpLinkDialog } from "@/components/WarpLinkDialog";
import { NetplayLobbyDialog } from "@/components/NetplayLobbyDialog";
import { SYSTEMS, type Game, gameLaunchEndpoint } from "@/data/library";
import { useIntegration } from "@/lib/integration";
import { apiRequest, apiUrl, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GameCollectionWithItems, UploadedRom, RomSaveSlot, GameCheatCode } from "@shared/schema";
import {
  Heart,
  Play,
  Clock,
  Users,
  Star,
  Folder,
  Plus,
  ChevronDown,
  ChevronUp,
  Hash,
  Loader2,
  ImagePlus,
  Trash2,
  Zap,
  Check,
  Wifi,
  Timer,
  QrCode,
  ArrowLeft,
  Trophy,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Stat, HltbStat, SaveSlotCard, CheatRow } from "@/components/GameDetailSubComponents";
import { getSystemBrandTheme } from "@/lib/systemThemes";
import { motion, AnimatePresence } from "framer-motion";

// ── HLTB helpers ─────────────────────────────────────────────────────────────
interface HltbData {
  found: boolean;
  hltbTitle?: string | null;
  mainStory?: number | null;
  mainExtra?: number | null;
  completionist?: number | null;
}

function formatHltbTime(minutes: number | null | undefined): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return m >= 45 ? `${h + 1}h` : m >= 15 ? `${h}½h` : `${h}h`;
}

type GameDetailTab = "overview" | "saves" | "achievements" | "cheats" | "collections";

export function GameDetailDialog({
  game,
  onClose,
  onToggleFav,
  onRate,
  collections,
  onCreateCollection,
  onToggleCollection,
  onSetStatus,
  profileId = 1,
}: {
  game: Game | null;
  onClose: () => void;
  onToggleFav: (g: Game) => void;
  onRate: (g: Game, rating: number) => void;
  collections: GameCollectionWithItems[];
  onCreateCollection: () => void;
  onToggleCollection: (collectionId: number, game: Game, selected: boolean) => void;
  onSetStatus?: (g: Game, status: string) => void;
  profileId?: number;
}) {
  const { dispatch, config } = useIntegration();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<GameDetailTab>("overview");
  const [launching, setLaunching] = useState(false);
  const [wheelArtError, setWheelArtError] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [scrapingArt, setScrapingArt] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showWarp, setShowWarp] = useState(false);
  const [netplayOpen, setNetplayOpen] = useState(false);
  const [selectedRomId, setSelectedRomId] = useState<number | null>(null);

  useEffect(() => {
    setActiveTab("overview");
    setVideoPlaying(false);
    setShowWarp(false);
    setNetplayOpen(false);
  }, [game?.id]);

  // System brand theme
  const brandTheme = getSystemBrandTheme(game?.system);

  // ── RetroAchievements ──────────────────────────────────────────────────────
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

  // ── HowLongToBeat ──────────────────────────────────────────────────────────
  const { data: hltbData } = useQuery<HltbData>({
    queryKey: ["hltb", game?.romId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/roms/${game!.romId}/hltb`));
      if (!res.ok) return { found: false };
      return res.json();
    },
    enabled: !!game?.romId,
    staleTime: 1000 * 60 * 60 * 24 * 7,
  });

  const hasHltb = !!(hltbData?.found && (hltbData.mainStory || hltbData.mainExtra || hltbData.completionist));

  // ── Save States ────────────────────────────────────────────────────────────
  const { data: saveSlots = [], refetch: refetchSlots } = useQuery<RomSaveSlot[]>({
    queryKey: ["save-states", game?.romId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/roms/${game!.romId}/save-states`));
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!game?.romId,
  });

  const latestSave = saveSlots.length > 0
    ? saveSlots.reduce((prev, curr) => (prev.updatedAt > curr.updatedAt ? prev : curr))
    : null;

  const deleteSlot = async (slot: number) => {
    if (!game?.romId) return;
    await apiRequest("DELETE", `/api/roms/${game.romId}/save-states/${slot}`);
    await refetchSlots();
  };

  // ── Cheats ─────────────────────────────────────────────────────────────────
  const [cheatDesc, setCheatDesc] = useState("");
  const [cheatCode, setCheatCode] = useState("");
  const [addingCheat, setAddingCheat] = useState(false);
  const [fetchingCheats, setFetchingCheats] = useState(false);
  const [fetchedCheats, setFetchedCheats] = useState<{ desc: string; code: string; selected: boolean }[] | null>(null);
  const [fetchMsg, setFetchMsg] = useState<string | null>(null);

  const { data: cheats = [], refetch: refetchCheats } = useQuery<GameCheatCode[]>({
    queryKey: ["cheats", game?.romId, profileId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/roms/${game!.romId}/cheats?profileId=${profileId}`));
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!game?.romId,
  });

  const addCheat = async () => {
    if (!game?.romId || !cheatDesc.trim() || !cheatCode.trim()) return;
    setAddingCheat(true);
    try {
      await apiRequest("POST", `/api/roms/${game.romId}/cheats`, {
        description: cheatDesc.trim(),
        code: cheatCode.trim(),
        profileId,
      });
      setCheatDesc("");
      setCheatCode("");
      await refetchCheats();
    } finally {
      setAddingCheat(false);
    }
  };

  const toggleCheat = async (id: number, enabled: boolean) => {
    await apiRequest("PATCH", `/api/cheats/${id}`, { enabled });
    await refetchCheats();
  };

  const deleteCheat = async (id: number) => {
    await apiRequest("DELETE", `/api/cheats/${id}`);
    await refetchCheats();
  };

  const fetchCheatsFromDb = async () => {
    if (!game?.romId) return;
    setFetchingCheats(true);
    setFetchedCheats(null);
    setFetchMsg(null);
    try {
      const res = await fetch(apiUrl(`/api/roms/${game.romId}/fetch-cheats`));
      const data = await res.json() as { cheats: { desc: string; code: string }[]; message?: string };
      if (data.cheats.length === 0) {
        setFetchMsg(data.message ?? "No cheats found.");
      } else {
        setFetchedCheats(data.cheats.map((c) => ({ ...c, selected: false })));
      }
    } catch {
      setFetchMsg("Network error. Check your connection.");
    } finally {
      setFetchingCheats(false);
    }
  };

  const importSelectedCheats = async () => {
    if (!game?.romId || !fetchedCheats) return;
    const selected = fetchedCheats.filter((c) => c.selected);
    for (const c of selected) {
      await apiRequest("POST", `/api/roms/${game.romId}/cheats`, {
        description: c.desc,
        code: c.code,
        profileId,
      });
    }
    await refetchCheats();
    setFetchedCheats(null);
  };

  const refreshArt = useCallback(async () => {
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
  }, [game, toast]);

  if (!game) return null;

  const system = SYSTEMS.find((s) => s.id === game.system);
  const endpoint = gameLaunchEndpoint(game);

  const launch = async () => {
    const romId = selectedRomId || game.romId;
    if (romId) {
      setLaunching(true);
      const returnTo = encodeURIComponent(window.location.href);
      const playerUrl = apiUrl(`/api/roms/${romId}/player?return=${returnTo}&profile=${profileId}`);
      try {
        const probe = await fetch(playerUrl, { method: "HEAD" });
        if (!probe.ok) {
          const msg =
            probe.status === 404
              ? "This ROM file is missing from the server. Try re-uploading it."
              : probe.status === 403
              ? "Access denied. Make sure you are logged into Home Assistant."
              : `Launch failed (error ${probe.status}).`;
          toast({ title: "Couldn't start the game", description: msg, variant: "destructive" });
          setLaunching(false);
          return;
        }
      } catch {
        toast({
          title: "Can't reach HomeArcade",
          description: "Check that HomeArcade is running in Home Assistant, then try again.",
          variant: "destructive",
        });
        setLaunching(false);
        return;
      }
      onClose();
      window.location.href = playerUrl;
      return;
    }
    void dispatch({
      actionId: `launch_game:${game.id}`,
      label: `Launch ${game.title}`,
      endpoint,
      onSettle: onClose,
    });
  };

  const scoreDisplay = game.communityScore != null
    ? `${(game.communityScore / 2).toFixed(1)}/10`
    : null;

  const genrePills = game.genre
    ? game.genre.split(",").map((g) => g.trim()).filter(Boolean)
    : [];

  const showWheelArt = !!game.wheelArtUrl && !wheelArtError;

  const playTimeDisplay = (() => {
    const m = game.minutesPlayed ?? 0;
    if (!m) return "—";
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
  })();

  const descLong = game.description && game.description.length > 250;

  return (
    <Dialog open={!!game} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-system={game.system}
        className="fixed inset-0 z-50 w-screen h-dvh max-w-none max-h-none m-0 rounded-none border-0 bg-[#08080d]/95 backdrop-blur-3xl overflow-y-auto p-0 flex flex-col focus:outline-none transition-colors duration-500"
        data-testid="dialog-game-detail"
      >
        <DialogTitle className="sr-only">{game.title}</DialogTitle>
        <DialogDescription className="sr-only">{game.description || `Game hub for ${game.title}`}</DialogDescription>

        {/* ── AMBIENT FANART BACKGROUND ─────────────────────────────────── */}
        <div className="absolute inset-x-0 top-0 h-[480px] pointer-events-none overflow-hidden z-0">
          {game.artUrl ? (
            <img
              src={apiUrl(game.romId ? `/api/roms/${game.romId}/art` : `/api/art?url=${encodeURIComponent(game.artUrl)}`)}
              alt=""
              className="w-full h-full object-cover opacity-25 blur-2xl scale-110"
            />
          ) : (
            <div
              className="w-full h-full opacity-20"
              style={{
                background: `radial-gradient(circle at 50% 30%, ${brandTheme.accentDotColor}, transparent 70%)`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#08080d]/80 to-[#08080d]" />
        </div>

        {/* ── TOP HEADER / BACK BAR ─────────────────────────────────────── */}
        <header className="relative z-10 sticky top-0 px-6 py-4 flex items-center justify-between glass-panel border-b border-white/5">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-mono font-bold uppercase text-slate-300 hover:text-white transition-all hover:scale-105"
            data-testid="button-detail-close"
          >
            <ArrowLeft className="size-4" />
            <span>Indietro (ESC)</span>
          </button>

          {/* Dynamic System Brand Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-wider border ${brandTheme.badgeClass}`}
            >
              {brandTheme.brandLabel}
            </span>
          </div>
        </header>

        {/* ── HERO CONTENT & ACTION BAR ─────────────────────────────────── */}
        <div className="relative z-10 max-w-6xl mx-auto w-full px-6 pt-6 pb-12 flex-1 flex flex-col gap-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-white/10">
            {/* Box Art Thumbnail (Desktop) + Title & Metadata */}
            <div className="flex items-start gap-6">
              <div className="relative size-28 sm:size-36 rounded-2xl overflow-hidden glass-panel border border-white/15 shrink-0 shadow-2xl group">
                <GameArt game={game} priority={true} />
                {game.romId && (
                  <button
                    onClick={refreshArt}
                    disabled={scrapingArt}
                    title="Ricarica cover art"
                    className="absolute bottom-2 right-2 size-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid="button-refresh-art"
                  >
                    {scrapingArt ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2.5 font-mono text-xs text-muted-foreground uppercase tracking-widest">
                  <span className="font-bold text-primary">{system?.shortName}</span>
                  {game.year > 0 && <span>• {game.year}</span>}
                  {game.developer && <span>• {game.developer}</span>}
                </div>

                <h1
                  className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight font-display drop-shadow-md"
                  data-testid="text-game-title"
                >
                  {game.title}
                </h1>

                {/* Rating stars & genre tags */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="flex items-center text-amber-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => onRate(game, star)}
                        title={`Vota ${star} stelle`}
                        className="hover:scale-125 transition-transform"
                        data-testid={`button-rate-${star}`}
                      >
                        <Star className={`size-4 ${game.rating >= star ? "fill-amber-400" : "text-muted-foreground/40"}`} />
                      </button>
                    ))}
                  </div>

                  {genrePills.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[10px] font-mono uppercase text-slate-300 font-semibold"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── ACTION BAR ────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Play Now Button */}
              <button
                onClick={launch}
                className="flex-1 md:flex-initial px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-extrabold text-sm uppercase tracking-wider shadow-xl glow-primary hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 focus:outline-none"
                data-testid="button-detail-launch"
              >
                <Play className="size-5 fill-current" />
                <span>{launching ? "Avvio in corso…" : "GIOCA ORA"}</span>
              </button>

              {/* Resume Button (if latest save exists) */}
              {latestSave && (
                <button
                  onClick={launch}
                  className="px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 hover:scale-105"
                  data-testid="button-detail-resume"
                >
                  <Zap className="size-4 text-accent fill-current" />
                  <span>Riprendi</span>
                </button>
              )}

              {/* Favorite Button */}
              <button
                onClick={() => onToggleFav(game)}
                className={`size-12 rounded-2xl border flex items-center justify-center transition-all hover:scale-105 ${
                  game.favorite
                    ? "bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                    : "bg-white/[0.05] border-white/10 text-white/70 hover:text-white"
                }`}
                title={game.favorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                data-testid="button-detail-fav"
              >
                <Heart className={`size-5 ${game.favorite ? "fill-current" : ""}`} />
              </button>

              {/* Warp Link Button */}
              <button
                onClick={() => setShowWarp(true)}
                className="size-12 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-105"
                title="Warp Link (Continua su Smartphone)"
                data-testid="button-detail-warp"
              >
                <QrCode className="size-5 text-accent" />
              </button>

              {/* Netplay Button */}
              {game.romId && (
                <button
                  onClick={() => setNetplayOpen(true)}
                  className="size-12 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-105"
                  title="Multiplayer Netplay"
                  data-testid="button-detail-netplay"
                >
                  <Wifi className="size-5" />
                </button>
              )}
            </div>
          </div>

          {/* ── NAVIGATION TABS ────────────────────────────────────────── */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            {[
              { id: "overview", label: "Panoramica & Info" },
              { id: "saves", label: `Salvataggi (${saveSlots.length})` },
              { id: "achievements", label: "Obiettivi RA" },
              { id: "cheats", label: `Trucchi (${cheats.length})` },
              { id: "collections", label: `Collezioni (${collections.filter(c => c.romIds.includes(game.romId ?? -1)).length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as GameDetailTab)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="active-hub-tab"
                    className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/15"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── TAB CONTENT: PANORAMICA ─────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {/* Left 2 Cols: Description & Stats */}
              <div className="lg:col-span-2 space-y-6">
                {game.description && (
                  <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">
                      Trama & Descrizione
                    </h3>
                    <p className={`text-sm text-slate-300 leading-relaxed ${descExpanded ? "" : "line-clamp-4"}`}>
                      {game.description}
                    </p>
                    {descLong && (
                      <button
                        onClick={() => setDescExpanded(!descExpanded)}
                        className="text-xs font-mono font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
                      >
                        {descExpanded ? <><ChevronUp className="size-3.5" /> Meno</> : <><ChevronDown className="size-3.5" /> Leggi tutto</>}
                      </button>
                    )}
                  </div>
                )}

                {/* Technical / Gameplay Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat icon={<Star className="size-4 text-amber-400" />} label="Community" value={scoreDisplay ?? "—"} />
                  <Stat icon={<Users className="size-4 text-cyan-400" />} label="Giocatori" value={game.players !== "Uploaded ROM" ? (game.players || "1P") : "1P"} />
                  <Stat icon={<Clock className="size-4 text-primary" />} label="Tempo Giocato" value={playTimeDisplay} />
                  <Stat icon={<Hash className="size-4 text-emerald-400" />} label="Sessioni" value={game.playCount != null && game.playCount > 0 ? String(game.playCount) : "0"} />
                </div>

                {/* Play Status Selector */}
                {onSetStatus && (
                  <div className="glass-panel p-5 rounded-3xl border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">
                        Stato della Partita
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Traccia il tuo progresso nella libreria</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: "playing", label: "In Corso", color: "text-amber-400" },
                        { id: "beaten", label: "Completato", color: "text-emerald-400" },
                        { id: "completed", label: "100%", color: "text-purple-400" },
                      ].map(({ id, label, color }) => {
                        const active = game.playStatus === id;
                        return (
                          <button
                            key={id}
                            onClick={() => onSetStatus(game, active ? "unset" : id)}
                            className={`px-3 py-1.5 rounded-xl border font-mono text-xs uppercase tracking-wider transition-all ${
                              active
                                ? `border-primary bg-primary/20 ${color} font-bold shadow-sm`
                                : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-white"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Col: HowLongToBeat & Details */}
              <div className="space-y-6">
                {hasHltb && (
                  <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                    <div className="flex items-center gap-2">
                      <Timer className="size-4 text-accent" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                        How Long to Beat
                      </h3>
                    </div>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-muted-foreground">Storia Principale:</span>
                        <span className="text-white font-bold">{formatHltbTime(hltbData?.mainStory)}</span>
                      </div>
                      <div className="flex justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-muted-foreground">Storia + Extra:</span>
                        <span className="text-accent font-bold">{formatHltbTime(hltbData?.mainExtra)}</span>
                      </div>
                      <div className="flex justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-muted-foreground">Completista (100%):</span>
                        <span className="text-primary font-bold">{formatHltbTime(hltbData?.completionist)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB CONTENT: SALVATAGGI ─────────────────────────────────── */}
          {activeTab === "saves" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Snapshot e Slot di Salvataggio
                </h3>
              </div>
              {saveSlots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {saveSlots.map((slot) => (
                    <SaveSlotCard
                      key={slot.slot}
                      slot={slot}
                      romId={game.romId!}
                      onDelete={() => deleteSlot(slot.slot)}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-3">
                  <Clock className="size-8 text-muted-foreground/30 mx-auto" />
                  <div className="font-bold text-white text-sm">Nessun salvataggio trovato</div>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    I salvataggi rapidi verranno creati automaticamente durante le tue sessioni di gioco.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB CONTENT: OBIETTIVI (RETROACHIEVEMENTS) ──────────────── */}
          {activeTab === "achievements" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {raProgress && raProgress.NumAchievements > 0 ? (
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Trophy className="size-5 text-amber-400" />
                        RetroAchievements Progression
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {raProgress.NumAwarded} di {raProgress.NumAchievements} Obiettivi Sbloccati
                      </p>
                    </div>
                    <div className="text-2xl font-black font-display text-amber-400">
                      {Math.round((raProgress.NumAwarded / raProgress.NumAchievements) * 100)}%
                    </div>
                  </div>
                  <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-700"
                      style={{ width: `${(raProgress.NumAwarded / raProgress.NumAchievements) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center space-y-3">
                  <Trophy className="size-8 text-muted-foreground/30 mx-auto" />
                  <div className="font-bold text-white text-sm">Nessun Obiettivo Collegato</div>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Collega il tuo account RetroAchievements nelle Impostazioni per sincronizzare trofei e medaglie.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB CONTENT: TRUCCHI ────────────────────────────────────── */}
          {activeTab === "cheats" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Zap className="size-4 text-accent" />
                      Codici Cheat & Game Genie
                    </h3>
                    <p className="text-xs text-muted-foreground">Abilita o disabilita trucchi per questa ROM</p>
                  </div>
                  <Button
                    onClick={fetchCheatsFromDb}
                    disabled={fetchingCheats}
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs uppercase"
                  >
                    {fetchingCheats ? <Loader2 className="size-3.5 animate-spin mr-2" /> : <Zap className="size-3.5 mr-2" />}
                    Scarica dal Database
                  </Button>
                </div>

                {cheats.length > 0 ? (
                  <div className="space-y-2">
                    {cheats.map((c) => (
                      <CheatRow
                        key={c.id}
                        cheat={c}
                        onToggle={() => toggleCheat(c.id, !c.enabled)}
                        onDelete={() => deleteCheat(c.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground font-mono">
                    Nessun trucco configurato. Clicca su &quot;Scarica dal Database&quot; per importarli automaticamente.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB CONTENT: COLLEZIONI ─────────────────────────────────── */}
          {activeTab === "collections" && (
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Folder className="size-4 text-primary" />
                    Collezioni Utente
                  </h3>
                  <p className="text-xs text-muted-foreground">Organizza questo gioco nelle tue collezioni personali</p>
                </div>
                <Button onClick={onCreateCollection} size="sm" variant="outline" className="font-mono text-xs uppercase">
                  <Plus className="size-3.5 mr-1" /> Nuova Collezione
                </Button>
              </div>

              {collections.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {collections.map((col) => {
                    const selected = col.romIds.includes(game.romId ?? -1);
                    return (
                      <button
                        key={col.id}
                        onClick={() => onToggleCollection(col.id, game, !selected)}
                        className={`px-4 py-2 rounded-2xl border font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                          selected
                            ? "bg-primary/20 border-primary text-primary font-bold shadow-sm"
                            : "bg-white/[0.04] border-white/10 text-muted-foreground hover:text-white"
                        }`}
                      >
                        <Folder className="size-3.5" />
                        <span>{col.name}</span>
                        {selected && <Check className="size-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground font-mono">
                  Nessuna collezione creata.
                </div>
              )}
            </div>
          )}

        </div>

      </DialogContent>

      <WarpLinkDialog
        game={showWarp ? game : null}
        slot={latestSave?.slot}
        onClose={() => setShowWarp(false)}
      />
      {game.romId && (
        <NetplayLobbyDialog
          game={game}
          open={netplayOpen}
          profileId={profileId}
          onClose={() => setNetplayOpen(false)}
        />
      )}
    </Dialog>
  );
}
