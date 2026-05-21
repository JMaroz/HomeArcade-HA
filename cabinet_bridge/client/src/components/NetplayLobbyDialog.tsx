/**
 * NetplayLobbyDialog
 *
 * Shows open netplay rooms for this server, lets the user host a new room
 * (getting back a shareable 6-char code) or join an existing one by code.
 * Once both players are connected the game launches automatically.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "@/lib/queryClient";
import { Wifi, WifiOff, Copy, Users, Loader2, ArrowRight } from "lucide-react";
import type { Game } from "@/data/library";

interface OpenRoom {
  code: string;
  createdAt: number;
}

export function NetplayLobbyDialog({
  game,
  open,
  profileId = 1,
  onClose,
}: {
  game: Game;
  open: boolean;
  profileId?: number;
  onClose: () => void;
}) {
  const [view, setView]             = useState<"lobby" | "hosting" | "joining">("lobby");
  const [dispCode, setDispCode]     = useState("");
  const [joinCode, setJoinCode]     = useState("");
  const [peerJoined, setPeerJoined] = useState(false);
  const [wsStatus, setWsStatus]     = useState<"idle" | "connecting" | "connected" | "error">("idle");

  // Use a ref so WS message handlers always see the latest code
  const codeRef = useRef("");
  const wsRef   = useRef<WebSocket | null>(null);

  // List open rooms, refreshed every 5 s
  const { data: rooms = [] } = useQuery<OpenRoom[]>({
    queryKey: ["/api/netplay/rooms"],
    refetchInterval: 5_000,
  });

  const wsUrl = apiUrl("/api/netplay").replace(/^http/, "ws");

  const launchNetplay = useCallback(
    (role: "host" | "client", code: string) => {
      if (!game.romId) return;
      const returnTo = encodeURIComponent(window.location.href);
      window.location.href = apiUrl(
        `/api/roms/${game.romId}/player?return=${returnTo}&profile=${profileId}&netplay_role=${role}&netplay_room=${code}`,
      );
    },
    [game.romId, profileId],
  );

  const openWs = useCallback(
    (firstMessage: object) => {
      if (wsRef.current) wsRef.current.close();
      setWsStatus("connecting");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus("connected");
        ws.send(JSON.stringify(firstMessage));
      };

      ws.onerror = () => setWsStatus("error");

      ws.onmessage = (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data as string) as Record<string, unknown>;
          const type = msg.type as string | undefined;

          if (type === "room-created") {
            const code = msg.room as string;
            codeRef.current = code;
            setDispCode(code);
            setView("hosting");
            return;
          }

          if (type === "room-joined") {
            const code = msg.room as string;
            codeRef.current = code;
            setDispCode(code);
            setView("joining");
            // Brief render, then navigate
            setTimeout(() => launchNetplay("client", code), 600);
            return;
          }

          if (type === "peer-joined") {
            setPeerJoined(true);
            setTimeout(() => launchNetplay("host", codeRef.current), 800);
            return;
          }

          if (type === "error") {
            setWsStatus("error");
          }
        } catch { /* binary relay data — ignore in lobby */ }
      };

      ws.onclose = () => setWsStatus((s) => (s === "connecting" ? "error" : s));
    },
    [wsUrl, launchNetplay],
  );

  const handleHostRoom = () => openWs({ type: "create-room" });

  const handleJoinCode = (code: string) => {
    if (code.length !== 6) return;
    openWs({ type: "join-room", room: code });
  };

  // Clean up WS on unmount
  useEffect(() => () => { wsRef.current?.close(); }, []);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-md bg-card border-card-border"
        data-testid="dialog-netplay-lobby"
      >
        <DialogTitle className="flex items-center gap-2 font-display text-lg">
          <Wifi className="size-4 text-primary" />
          Netplay — {game.title}
        </DialogTitle>

        {/* ── Lobby ─────────────────────────────────────────────── */}
        {view === "lobby" && (
          <div className="space-y-5">
            {/* Open rooms */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Open rooms{" "}
                <span className="opacity-40">· refreshes every 5s</span>
              </p>
              {rooms.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground border border-dashed border-border rounded-md">
                  No open rooms yet. Host one below!
                </p>
              ) : (
                <div className="space-y-1.5">
                  {rooms.map((r) => (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => handleJoinCode(r.code)}
                      className="w-full flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2 hover:border-primary/40 hover:bg-primary/5 transition-all"
                      data-testid={`button-join-open-room-${r.code}`}
                    >
                      <span className="font-mono text-sm tracking-[0.25em] font-bold">
                        {r.code}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="size-3" />
                        1/2{" · "}{formatAge(r.createdAt)}
                        <ArrowRight className="size-3 text-primary" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Host new room */}
            <Button
              onClick={handleHostRoom}
              disabled={wsStatus === "connecting"}
              className="w-full gap-2"
              data-testid="button-host-room"
            >
              {wsStatus === "connecting"
                ? <Loader2 className="size-4 animate-spin" />
                : <Wifi className="size-4" />}
              Host a room
            </Button>

            {/* Join by code */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Or enter a room code
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinCode(joinCode)}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="flex-1 rounded-md border border-border bg-background/70 px-3 py-2 font-mono text-sm tracking-[0.3em] text-center text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                  data-testid="input-join-room-code"
                />
                <Button
                  onClick={() => handleJoinCode(joinCode)}
                  disabled={joinCode.length !== 6 || wsStatus === "connecting"}
                  variant="outline"
                  className="gap-1.5"
                  data-testid="button-join-room"
                >
                  Join
                </Button>
              </div>
            </div>

            {wsStatus === "error" && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <WifiOff className="size-3" /> Connection error — please try again.
              </p>
            )}
          </div>
        )}

        {/* ── Hosting ───────────────────────────────────────────── */}
        {view === "hosting" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Your room code
              </p>
              <p
                className="font-display text-4xl font-bold tracking-[0.3em] text-primary select-all"
                data-testid="text-room-code"
              >
                {dispCode}
              </p>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(dispCode)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
                data-testid="button-copy-room-code"
              >
                <Copy className="size-3" /> Copy to clipboard
              </button>
            </div>

            {peerJoined ? (
              <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-center">
                <p className="text-sm text-green-400 font-mono">
                  Friend joined! Launching game…
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Waiting for a friend to join…
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => { wsRef.current?.close(); setView("lobby"); setDispCode(""); setPeerJoined(false); setWsStatus("idle"); }}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* ── Joining ───────────────────────────────────────────── */}
        {view === "joining" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-5 text-center space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Joining room
              </p>
              <p className="font-display text-3xl font-bold tracking-[0.3em] text-green-400">
                {dispCode}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Launching game…
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function formatAge(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}
