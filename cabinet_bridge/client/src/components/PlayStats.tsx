/**
 * PlayStats — displays system-level play statistics from play_sessions.
 * Shows total time, most-played systems, top games, and recent sessions.
 */
import React, { useState, useEffect } from "react";
import { SYSTEMS } from "@/data/library";

interface PlaySession {
  id: number;
  title: string;
  system: string;
  startedAt: number;
  endedAt: number | null;
  durationSeconds: number | null;
}

interface SystemStat {
  system: string;
  label: string;
  totalMinutes: number;
  count: number;
}

interface GameStat {
  title: string;
  system: string;
  totalMinutes: number;
  count: number;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function PlayStats() {
  const [sessions, setSessions] = useState<PlaySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then(r => r.json())
      .then((data: PlaySession[]) => { setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <span className="font-mono text-xs uppercase tracking-widest">Loading stats…</span>
      </div>
    );
  }

  // Total time
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0) / 60, 0);

  // Per-system stats
  const systemMap = new Map<string, SystemStat>();
  const gameMap = new Map<string, GameStat>();

  for (const s of sessions) {
    if (!s.durationSeconds) continue;
    const mins = s.durationSeconds / 60;

    // System
    const existing = systemMap.get(s.system) ?? {
      system: s.system,
      label: SYSTEMS.find(sys => sys.id === s.system)?.name ?? s.system,
      totalMinutes: 0,
      count: 0,
    };
    existing.totalMinutes += mins;
    existing.count += 1;
    systemMap.set(s.system, existing);

    // Game
    const key = `${s.title}::${s.system}`;
    const gExisting = gameMap.get(key) ?? {
      title: s.title,
      system: s.system,
      totalMinutes: 0,
      count: 0,
    };
    gExisting.totalMinutes += mins;
    gExisting.count += 1;
    gameMap.set(key, gExisting);
  }

  const topSystems = [...systemMap.values()].sort((a, b) => b.totalMinutes - a.totalMinutes).slice(0, 6);
  const topGames = [...gameMap.values()].sort((a, b) => b.totalMinutes - a.totalMinutes).slice(0, 8);
  const maxSystemMins = topSystems[0]?.totalMinutes ?? 1;

  // Recent sessions (last 10 with duration)
  const recent = [...sessions]
    .filter(s => s.durationSeconds)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-sidebar/30 p-5 text-center">
          <div className="font-display text-3xl font-black tracking-tight">{formatDuration(totalMinutes)}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Total Play Time</div>
        </div>
        <div className="rounded-xl border border-border bg-sidebar/30 p-5 text-center">
          <div className="font-display text-3xl font-black tracking-tight">{sessions.length}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Sessions Logged</div>
        </div>
      </div>

      {/* Top systems */}
      {topSystems.length > 0 && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Top Systems</div>
          <div className="space-y-3">
            {topSystems.map((stat) => (
              <div key={stat.system} className="flex items-center gap-3">
                <div className="w-20 shrink-0 font-mono text-xs text-right text-muted-foreground">{stat.label}</div>
                <div className="flex-1 h-5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${(stat.totalMinutes / maxSystemMins) * 100}%` }}
                  />
                </div>
                <div className="w-16 shrink-0 font-mono text-xs text-right text-white/60">{formatDuration(stat.totalMinutes)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top games */}
      {topGames.length > 0 && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Top Games</div>
          <div className="space-y-2">
            {topGames.map((stat, i) => (
              <div key={`${stat.title}-${stat.system}`} className="flex items-center gap-3">
                <div className="w-5 shrink-0 font-mono text-[10px] text-muted-foreground text-right">#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs truncate">{stat.title}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{SYSTEMS.find(s => s.id === stat.system)?.name ?? stat.system}</div>
                </div>
                <div className="shrink-0 font-mono text-xs text-white/60">{formatDuration(stat.totalMinutes)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      {recent.length > 0 && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Recent Sessions</div>
          <div className="space-y-2">
            {recent.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs truncate">{s.title}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {SYSTEMS.find(sys => sys.id === s.system)?.name ?? s.system} · {formatRelative(s.startedAt)}
                  </div>
                </div>
                <div className="shrink-0 font-mono text-xs text-white/60">
                  {s.durationSeconds ? formatDuration(s.durationSeconds / 60) : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="font-mono text-xs">No play sessions yet.</div>
          <div className="font-mono text-[10px] mt-1 opacity-60">Play some games to see your stats here.</div>
        </div>
      )}
    </div>
  );
}