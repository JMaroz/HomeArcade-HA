import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Cabinet Bridge integration layer.
 *
 * In production this would call Home Assistant webhooks (see Settings page for
 * the endpoint URLs). For the prototype every action runs through `dispatch`
 * which logs the call, optionally fires `fetch`, and feeds an in-memory log
 * that the Activity panel renders.
 *
 * No persistence — the prototype intentionally avoids localStorage / cookies
 * because the app is designed to live inside a Home Assistant iframe panel
 * where browser storage APIs are unreliable. Real installations would persist
 * configuration in HA itself (input_text helpers, REST commands, etc.).
 */

export type CallStatus = "queued" | "ok" | "error" | "simulated";

export interface CallLogEntry {
  id: string;
  ts: number;
  label: string;
  endpoint: string;
  status: CallStatus;
  detail?: string;
}

export interface IntegrationConfig {
  /** Base URL of the Home Assistant instance, e.g. https://ha.local:8123 */
  haBaseUrl: string;
  /** Long-lived access token (optional — webhooks usually don't need one). */
  haToken: string;
  /** When false, calls are logged locally but no fetch() is made. */
  liveMode: boolean;
  /** Override map for action endpoints by id. */
  endpoints: Record<string, string>;
}

export interface PcStatus {
  online: boolean;
  state: "online" | "sleeping" | "offline" | "starting";
  ip: string;
  hostname: string;
  cpu: number; // 0-100
  ram: number; // 0-100
  uptimeMin: number;
  currentApp: string | null;
}

interface IntegrationContextValue {
  config: IntegrationConfig;
  setConfig: (next: Partial<IntegrationConfig>) => void;
  setEndpoint: (id: string, url: string) => void;
  pc: PcStatus;
  log: CallLogEntry[];
  dispatch: (params: {
    actionId: string;
    label: string;
    endpoint: string;
    /** Optional side-effect to simulate after the call resolves. */
    onSettle?: () => void;
  }) => Promise<void>;
}

const defaultConfig: IntegrationConfig = {
  haBaseUrl: "https://homeassistant.local:8123",
  haToken: "",
  liveMode: false,
  endpoints: {},
};

const defaultPc: PcStatus = {
  online: true,
  state: "online",
  ip: "192.168.1.42",
  hostname: "ARCADE-PC",
  cpu: 14,
  ram: 38,
  uptimeMin: 184,
  currentApp: "RetroBat",
};

const IntegrationContext = createContext<IntegrationContextValue | null>(null);

let logSeq = 0;

export function IntegrationProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<IntegrationConfig>(defaultConfig);
  const [pc, setPc] = useState<PcStatus>(defaultPc);
  const [log, setLog] = useState<CallLogEntry[]>([]);

  const setConfig = useCallback((next: Partial<IntegrationConfig>) => {
    setConfigState((prev) => ({ ...prev, ...next }));
  }, []);

  const setEndpoint = useCallback((id: string, url: string) => {
    setConfigState((prev) => ({
      ...prev,
      endpoints: { ...prev.endpoints, [id]: url },
    }));
  }, []);

  const dispatch = useCallback<IntegrationContextValue["dispatch"]>(
    async ({ actionId, label, endpoint, onSettle }) => {
      const id = `call-${++logSeq}`;
      const ts = Date.now();
      const resolved = config.endpoints[actionId] || endpoint;
      const live = config.liveMode && /^https?:\/\//i.test(resolved);

      setLog((prev) => [
        { id, ts, label, endpoint: resolved, status: "queued" as CallStatus },
        ...prev,
      ].slice(0, 40));

      // Simulate light-touch effects on PC state for power actions.
      const settleFromAction = () => {
        if (actionId === "sleep_pc") {
          setPc((p) => ({ ...p, online: false, state: "sleeping", currentApp: null }));
        } else if (actionId === "shutdown_pc") {
          setPc((p) => ({ ...p, online: false, state: "offline", currentApp: null }));
        } else if (actionId === "wake_pc") {
          setPc((p) => ({ ...p, online: true, state: "starting", currentApp: null, uptimeMin: 0 }));
          setTimeout(() => {
            setPc((p) => ({ ...p, state: "online", currentApp: "Windows" }));
          }, 1500);
        } else if (actionId === "launch_retrobat") {
          setPc((p) => ({ ...p, online: true, state: "online", currentApp: "RetroBat" }));
        } else if (actionId === "restart_pc") {
          setPc((p) => ({ ...p, state: "starting", currentApp: null }));
          setTimeout(() => {
            setPc((p) => ({ ...p, state: "online", currentApp: "Windows" }));
          }, 1500);
        } else if (actionId.startsWith("launch_game:")) {
          const title = label.replace(/^Launch\s+/i, "");
          setPc((p) => ({ ...p, online: true, state: "online", currentApp: title }));
        }
        onSettle?.();
      };

      let status: CallStatus = "simulated";
      let detail: string | undefined;

      if (live) {
        try {
          const res = await fetch(resolved, {
            method: "POST",
            headers: config.haToken
              ? { Authorization: `Bearer ${config.haToken}` }
              : undefined,
          });
          status = res.ok ? "ok" : "error";
          detail = `${res.status} ${res.statusText}`;
        } catch (err) {
          status = "error";
          detail = err instanceof Error ? err.message : String(err);
        }
      } else {
        // Brief artificial latency so the UI shows the queued state.
        await new Promise((r) => setTimeout(r, 320));
        detail = "Simulated — enable Live mode in Settings to call HA";
      }

      setLog((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, status, detail } : entry,
        ),
      );

      if (status === "ok" || status === "simulated") {
        settleFromAction();
      }
    },
    [config],
  );

  const value = useMemo<IntegrationContextValue>(
    () => ({ config, setConfig, setEndpoint, pc, log, dispatch }),
    [config, setConfig, setEndpoint, pc, log, dispatch],
  );

  return (
    <IntegrationContext.Provider value={value}>
      {children}
    </IntegrationContext.Provider>
  );
}

export function useIntegration() {
  const ctx = useContext(IntegrationContext);
  if (!ctx) throw new Error("useIntegration must be used inside IntegrationProvider");
  return ctx;
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
