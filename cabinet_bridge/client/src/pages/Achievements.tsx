import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Trophy, 
  Target, 
  ChevronRight, 
  Loader2,
  Medal,
  Sparkles,
} from "lucide-react";
import { useIntegration } from "@/lib/integration";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ConsoleTopBar } from "@/components/ConsoleTopBar";

export default function Achievements() {
  const { config } = useIntegration();
  const { t } = useTranslation();
  const raUsername = config.raUsername ?? "";
  const raToken = config.raToken ?? "";
  const hasCredentials = !!(raUsername && raToken);

  const { data: summary, isLoading } = useQuery<{
    totalPoints: number;
    totalAchievements: number;
    recentAchievements: any[];
    games: any[];
  }>({
    queryKey: ["/api/retroachievements/summary"],
    enabled: hasCredentials,
  });

  if (!hasCredentials) {
    return (
      <div className="flex-1 min-w-0 flex flex-col h-full bg-[#08080d] text-white overflow-hidden">
        <ConsoleTopBar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center overscroll-y-contain">
          <div className="max-w-md space-y-6 glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl">
            <div className="size-20 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto ring-8 ring-primary/5">
              <Trophy className="size-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-black text-white">
                {t("achievements.locked") || "Obiettivi Bloccati"}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Collega il tuo account <strong>RetroAchievements.org</strong> nelle Impostazioni per tracciare i trofei sbloccati, i punti e la tua classifica mondiale.
              </p>
            </div>
            <Link href="/settings">
              <Button size="lg" className="w-full gap-2 font-mono uppercase tracking-wider bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white font-bold">
                <Target className="size-4" /> {t("achievements.connect") || "Collega Account"}
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 min-w-0 flex flex-col h-full bg-[#08080d] text-white overflow-hidden">
        <ConsoleTopBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full bg-[#08080d] text-white overflow-hidden">
      <ConsoleTopBar />
      <main className="flex-1 overflow-y-auto overscroll-y-contain pb-24 lg:pb-12 px-4 sm:px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary font-bold flex items-center gap-2">
                <Sparkles className="size-3.5" />
                {t("achievements.header") || "Hall of Fame"}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
                RetroAchievements
              </h1>
            </div>
            
            {/* Quick Stats Pill */}
            <div className="flex items-center gap-4 bg-white/[0.04] p-2.5 px-4 rounded-2xl border border-white/10 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-amber-400" />
                <span><strong className="text-white">{summary?.totalAchievements ?? 0}</strong> Sbloccati</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Medal className="size-4 text-primary" />
                <span><strong className="text-white">{summary?.totalPoints ?? 0}</strong> Punti</span>
              </div>
            </div>
          </div>

          {/* Games List with Achievements */}
          <div className="space-y-4">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Giochi Sincronizzati
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(summary?.games ?? []).map((g: any) => (
                <div key={g.GameId || g.Title} className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex items-center gap-4">
                  {g.BadgeUrl ? (
                    <img src={g.BadgeUrl} alt="" className="size-14 rounded-xl object-cover shrink-0 border border-white/10" />
                  ) : (
                    <div className="size-14 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <Trophy className="size-6 text-amber-400/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="font-bold text-sm text-white truncate">{g.Title}</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                        <span>Progresso:</span>
                        <span className="text-amber-400 font-bold">{g.NumAwarded} / {g.NumAchievements}</span>
                      </div>
                      <Progress value={g.NumAchievements > 0 ? (g.NumAwarded / g.NumAchievements) * 100 : 0} className="h-1.5 bg-white/10" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
