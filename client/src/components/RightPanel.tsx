import { Button } from "@/components/ui/button";
import { useIntegration, formatRelative, type CallStatus } from "@/lib/integration";
import { QUICK_ACTIONS } from "@/data/library";
import {
  Power,
  Moon,
  Zap,
  Tv,
  Gamepad2,
  RotateCw,
  Volume2,
  Activity,
  Cpu,
  HardDrive,
} from "lucide-react";

const ICONS = { Power, Moon, Zap, Tv, Gamepad2, RotateCw, Volume2 } as const;

export function RightPanel({
  arcadeMode,
  onToggleArcade,
}: {
  arcadeMode: boolean;
  onToggleArcade: () => void;
}) {
  const { pc, log, dispatch } = useIntegration();

  return (
    <aside
      className="hidden xl:flex flex-col w-80 shrink-0 border-l border-border bg-sidebar/50"
      data-testid="panel-right"
    >
      <div className="px-5 py-5 border-b border-border">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Emulator PC
        </div>
        <div className="flex items-center gap-2.5">
          <div
            className={`size-2.5 rounded-full ${
              pc.state === "online"
                ? "bg-status-online shadow-[0_0_12px_rgba(34,197,94,0.6)]"
                : pc.state === "starting" || pc.state === "sleeping"
                ? "bg-status-away"
                : "bg-status-offline"
            }`}
            aria-hidden
          />
          <div className="font-display text-base font-bold leading-tight">
            {pc.hostname}
          </div>
        </div>
        <div className="mt-1 font-mono text-[12px] text-muted-foreground">
          {labelForState(pc.state)}
          {pc.currentApp ? (
            <>
              {" · "}
              <span className="text-foreground/80">{pc.currentApp}</span>
            </>
          ) : null}
          {" · "}
          {pc.ip}
        </div>

        {pc.state === "online" ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Meter icon={<Cpu className="size-3.5" />} label="CPU" value={pc.cpu} />
            <Meter icon={<HardDrive className="size-3.5" />} label="RAM" value={pc.ram} />
          </div>
        ) : null}
      </div>

      <div className="px-5 py-5 border-b border-border">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Quick Actions
        </div>
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((qa) => {
            const Icon = ICONS[qa.icon];
            const variant =
              qa.tone === "primary"
                ? "default"
                : qa.tone === "danger"
                ? "destructive"
                : qa.tone === "warning"
                ? "outline"
                : "secondary";
            return (
              <Button
                key={qa.id}
                variant={variant as never}
                size="sm"
                className="justify-start font-mono text-[11px] min-h-9 whitespace-normal leading-tight"
                onClick={() =>
                  dispatch({
                    actionId: qa.id,
                    label: qa.label,
                    endpoint: qa.defaultEndpoint,
                  })
                }
                data-testid={`button-action-${qa.id}`}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">{qa.label}</span>
              </Button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onToggleArcade}
          aria-pressed={arcadeMode}
          className="mt-3 w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border border-border bg-background/40 hover-elevate active-elevate-2 text-[13px] font-mono"
          data-testid="button-toggle-crt"
        >
          <span className="flex items-center gap-2">
            <Tv className="size-3.5" />
            CRT Scanlines
          </span>
          <span
            className={`text-[11px] uppercase tracking-wider ${
              arcadeMode ? "text-accent neon-cyan" : "text-muted-foreground"
            }`}
          >
            {arcadeMode ? "ON" : "OFF"}
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-4 pb-2 sticky top-0 bg-sidebar/80 backdrop-blur-md flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
            <Activity className="size-3" /> Activity
          </div>
          <span
            className="font-mono text-[10px] text-muted-foreground"
            data-testid="text-activity-count"
          >
            {log.length === 0 ? "No calls" : `${log.length} call${log.length === 1 ? "" : "s"}`}
          </span>
        </div>
        <ul className="px-3 pb-4 space-y-1.5" data-testid="list-activity">
          {log.length === 0 ? (
            <li className="px-2 py-6 text-center font-mono text-[11px] text-muted-foreground">
              No actions yet. Try Wake PC or launch a game.
            </li>
          ) : null}
          {log.map((entry) => (
            <li
              key={entry.id}
              className="px-3 py-2 rounded-md border border-border bg-background/40"
              data-testid={`row-activity-${entry.id}`}
            >
              <div className="flex items-center justify-between gap-2 text-[12px]">
                <span className="font-medium truncate">{entry.label}</span>
                <StatusBadge status={entry.status} />
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-muted-foreground truncate">
                {entry.endpoint}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                {formatRelative(entry.ts)}
                {entry.detail ? ` · ${entry.detail}` : ""}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function Meter({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border border-border bg-background/40 px-3 py-2">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em]">
          {icon} {label}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-foreground">
          {value}%
        </span>
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
        <div
          className="h-full bg-arcade-gradient"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: CallStatus }) {
  const map: Record<CallStatus, { text: string; cls: string }> = {
    queued: { text: "Queued", cls: "text-muted-foreground border-border" },
    ok: { text: "200 OK", cls: "text-status-online border-status-online/40" },
    error: { text: "Error", cls: "text-destructive border-destructive/40" },
    simulated: { text: "Sim", cls: "text-accent border-accent/40" },
  };
  const v = map[status];
  return (
    <span
      className={`px-1.5 py-0.5 rounded border font-mono text-[10px] uppercase tracking-wider ${v.cls}`}
    >
      {v.text}
    </span>
  );
}

function labelForState(s: string) {
  switch (s) {
    case "online":
      return "Online";
    case "starting":
      return "Booting";
    case "sleeping":
      return "Sleeping";
    case "offline":
      return "Offline";
    default:
      return s;
  }
}
