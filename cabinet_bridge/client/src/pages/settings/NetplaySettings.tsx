/**
 * NetplaySettings — Configuration for multiplayer sessions.
 * Lets users set their nickname and port for the built-in and native Netplay.
 */
import React from "react";
import { useIntegration } from "@/lib/integration";
import { Input } from "@/components/ui/input";
import { Section, Field } from "./SettingsShared";
import { User, Hash, Wifi } from "lucide-react";

export function NetplaySettings() {
  const { config, setConfig } = useIntegration();

  return (
    <div className="space-y-10">
      <Section
        title="Netplay Configuration"
        description="Configure your online presence for multiplayer gaming. These settings apply to the built-in netplay and compatible native launchers."
      >
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
          <Field label="Netplay Nickname" hint="Your display name in netplay sessions.">
            <div className="relative">
              <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={config.netplayNickname}
                onChange={(e) => setConfig({ netplayNickname: e.target.value })}
                placeholder="HomeArcadePlayer"
                className="pl-9 font-mono text-sm"
              />
            </div>
          </Field>

          <Field label="Netplay Port" hint="Default port for hosting sessions (typically 55435).">
            <div className="relative">
              <Hash className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                value={config.netplayPort}
                onChange={(e) => setConfig({ netplayPort: parseInt(e.target.value) || 55435 })}
                placeholder="55435"
                className="pl-9 font-mono text-sm"
              />
            </div>
          </Field>

          <Field label="Synchronization Mode" hint="Rollback is recommended for high-speed games. Lockstep is more stable on high-latency connections.">
             <div className="flex gap-2 p-1 bg-muted/30 border border-border/50 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setConfig({ netplaySyncMode: "rollback" })}
                className={`h-8 px-4 font-bold text-[10px] uppercase tracking-wider rounded-md transition-all ${config.netplaySyncMode === "rollback" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"}`}
              >
                Rollback (Fast)
              </button>
              <button
                type="button"
                onClick={() => setConfig({ netplaySyncMode: "lockstep" })}
                className={`h-8 px-4 font-bold text-[10px] uppercase tracking-wider rounded-md transition-all ${config.netplaySyncMode === "lockstep" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"}`}
              >
                Lockstep (Stable)
              </button>
            </div>
          </Field>
        </div>
      </Section>

      <Section
        title="About Netplay"
        description="How to play with friends using HomeArcade."
      >
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            HomeArcade supports two types of Netplay:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Built-in (Web):</strong> Uses the browser-based emulator. When you click "Netplay" on a game detail page, you can host a room and get a code to share with a friend.
            </li>
            <li>
              <strong>Native (RetroBat/RetroArch):</strong> If you use HomeArcade as a launcher for a local PC setup, your nickname and port are exposed to Home Assistant for use in external launch scripts.
            </li>
          </ul>
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-3 mt-4">
            <Wifi className="size-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Pro-tip for Hosting</p>
              <p className="text-xs">If you are hosting a session, ensure your firewall allows traffic on the configured port (default 55435) or that UPnP is enabled on your router.</p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
