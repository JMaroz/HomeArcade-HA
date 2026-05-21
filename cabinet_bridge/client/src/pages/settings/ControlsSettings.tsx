/**
 * ControlsSettings — Input & Calibration tab content for Settings page.
 * Covers gamepad detection, rumble, button mapping, and keyboard shortcuts.
 */
import React, { useState, useEffect } from "react";
import { useIntegration } from "@/lib/integration";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ControllerRemapDialog } from "@/components/ControllerRemapDialog";
import {
  detectControllerType,
  getButtonLayout,
  getShoulderLabels,
  getMenuLabels,
  getHotkeyCombo,
  RETROPAD_DEFAULTS,
  RETROARCH_HOTKEYS,
  type ControllerType,
} from "@/components/GamepadRemap";
import {
  Gamepad2, Activity, Database, Keyboard, ChevronRight, Loader2, Zap,
} from "lucide-react";
import { Section } from "./SettingsShared";
import { useProfile } from "@/lib/useProfile";
import { apiRequest } from "@/lib/queryClient";

// ── UI label helpers ──────────────────────────────────────────────────────────

function getButtonLabel(buttonIndex: number, type: ControllerType): string {
  const layout = getButtonLayout(type);
  return layout.find(b => b.index === buttonIndex)?.displayName ?? `BTN ${buttonIndex}`;
}

function getControllerTypeBadge(type: ControllerType): string {
  if (type === "playstation") return "PlayStation";
  if (type === "nintendo") return "Nintendo";
  if (type === "xbox") return "Xbox";
  return "Generic";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ControlsSettings() {
  const { config, setConfig } = useIntegration();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currentProfileId } = useProfile();
  const [gamepads, setGamepads] = useState<Gamepad[]>([]);
  const [pressedButtons, setPressedButtons] = useState<Record<number, number[]>>({});
  const [fetchingAutoconfig, setFetchingAutoconfig] = useState<string | null>(null);
  const [showRemapDialog, setShowRemapDialog] = useState(false);

  // Detect the type of the first connected controller for label rendering
  const primaryType: ControllerType = gamepads.length > 0
    ? detectControllerType(gamepads[0].id)
    : "xbox";

  const shoulder = getShoulderLabels(primaryType);
  const menuBtns = getMenuLabels(primaryType);

  // ── Autoconfig ──────────────────────────────────────────────────────────────
  const fetchAutoconfig = async (gp: Gamepad) => {
    setFetchingAutoconfig(gp.id);
    try {
      const res = await fetch(apiUrl(`/api/gamepad/autoconfig?id=${encodeURIComponent(gp.id)}`));
      if (!res.ok) throw new Error("No configuration found for this controller.");
      const data = await res.json();
      const cfg = data.mapping as Record<string, string>;
      const detectedType = detectControllerType(gp.id);

      // Persist the RetroPad default physical mapping for this controller type
      // to the server so in-game button routing is correct out of the box
      const retropadMap = RETROPAD_DEFAULTS[detectedType];
      try {
        await apiRequest(
          "PUT",
          `/api/profiles/${currentProfileId}/gamepad-bindings/default`,
          retropadMap,
        );
      } catch {
        // Non-fatal — the in-game mapping will still use the default
      }

      // Map the UI navigation actions from the autoconfig file
      const newMapping = { ...(config.uiGamepadMapping || {}) };
      if (cfg.input_a_btn !== undefined)     newMapping.select   = { kind: "button", buttonIndex: parseInt(cfg.input_a_btn) };
      if (cfg.input_b_btn !== undefined)     newMapping.back     = { kind: "button", buttonIndex: parseInt(cfg.input_b_btn) };
      if (cfg.input_x_btn !== undefined)     newMapping.favorite = { kind: "button", buttonIndex: parseInt(cfg.input_x_btn) };
      if (cfg.input_start_btn !== undefined) newMapping.menu     = { kind: "button", buttonIndex: parseInt(cfg.input_start_btn) };
      setConfig({ uiGamepadMapping: newMapping });

      toast({
        title: "Autoconfig Applied",
        description: `${getControllerTypeBadge(detectedType)} layout applied from "${data.source}".`,
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Autoconfig Failed", description: String(err) });
    } finally {
      setFetchingAutoconfig(null);
    }
  };

  // ── Gamepad polling ─────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      const activeGps = navigator.getGamepads?.().filter((g): g is Gamepad => g !== null) ?? [];
      setGamepads(activeGps);
      const nextPressed: Record<number, number[]> = {};
      activeGps.forEach((gp) => {
        const pressed: number[] = [];
        gp.buttons.forEach((btn, idx) => { if (btn.pressed) pressed.push(idx); });
        nextPressed[gp.index] = pressed;
      });
      setPressedButtons(nextPressed);
    };
    window.addEventListener("gamepadconnected", update);
    window.addEventListener("gamepaddisconnected", update);
    const timer = setInterval(update, 100);
    return () => {
      window.removeEventListener("gamepadconnected", update);
      window.removeEventListener("gamepaddisconnected", update);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-10">
      {showRemapDialog && (
        <ControllerRemapDialog
          activeButtons={gamepads.flatMap(gp =>
            gp.buttons.reduce<{ index: number; label: string; pressed: boolean }[]>((acc, btn, i) => {
              acc.push({ index: i, label: String(i), pressed: btn.pressed });
              return acc;
            }, [])
          )}
          mapping={config.uiGamepadMapping || {}}
          listeningAction={null}
          listenedBtn={null}
          lastPressedLabel=""
          gamepadId={gamepads[0]?.id ?? ""}
          onRemapAction={(actionId) => {
            let resolved = false;
            const DEAD_ZONE = 0.5;
            const rafTick = () => {
              if (resolved) return;
              const gps = navigator.getGamepads?.();
              for (const gp of gps ?? []) {
                if (!gp) continue;
                for (let i = 0; i < gp.buttons.length; i++) {
                  if (gp.buttons[i].pressed) {
                    const mapping = { ...(config.uiGamepadMapping || {}) };
                    mapping[actionId] = { kind: "button", buttonIndex: i };
                    setConfig({ uiGamepadMapping: mapping });
                    resolved = true;
                    return;
                  }
                }
                for (let i = 0; i < gp.axes.length; i++) {
                  const val = gp.axes[i];
                  if (Math.abs(val) > DEAD_ZONE) {
                    const mapping = { ...(config.uiGamepadMapping || {}) };
                    mapping[actionId] = { kind: "axis", axisIndex: i, direction: val > 0 ? 1 : -1 };
                    setConfig({ uiGamepadMapping: mapping });
                    resolved = true;
                    return;
                  }
                }
              }
              requestAnimationFrame(rafTick);
            };
            requestAnimationFrame(rafTick);
          }}
          onDone={() => setShowRemapDialog(false)}
          actions={[
            { id: "select", label: "Select / Open" },
            { id: "back", label: "Back / Close" },
            { id: "favorite", label: "Toggle Favorite" },
            { id: "menu", label: "System Menu" },
          ]}
        />
      )}

      {/* ── Rumble ──────────────────────────────────────────────────────────── */}
      <Section title={t("settings.sections.input.title")} description={t("settings.sections.input.description")}>
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-sidebar/40">
          <div className="space-y-0.5">
            <div className="font-display font-semibold text-sm">{t("settings.fields.rumble.label")}</div>
            <div className="text-xs text-muted-foreground">{t("settings.fields.rumble.hint")}</div>
          </div>
          <Switch checked={config.gamepadRumble} onCheckedChange={(v) => setConfig({ gamepadRumble: v })} />
        </div>
      </Section>

      {/* ── Connected Controllers ────────────────────────────────────────────── */}
      <Section title={t("settings.sections.controllers.title")} description={t("settings.sections.controllers.description")}>
        {gamepads.length === 0 ? (
          <div className="p-8 rounded-lg border border-dashed border-border bg-sidebar/10 flex flex-col items-center text-center gap-3">
            <Gamepad2 className="size-8 text-muted-foreground/30" />
            <div className="space-y-1">
              <p className="text-sm font-medium">No controllers detected</p>
              <p className="text-xs text-muted-foreground">Connect a USB or Bluetooth controller and press a button.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {gamepads.map((gp) => {
              const gpType = detectControllerType(gp.id);
              return (
                <div key={gp.index} className="p-5 rounded-xl border border-border bg-sidebar/20 space-y-4">
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Gamepad2 className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">{gp.id}</div>
                      <div className="flex flex-wrap gap-3 mt-1">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          Index: {gp.index}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {gp.buttons.length} Buttons
                        </span>
                        <span className={[
                          "font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded",
                          gpType === "playstation" ? "bg-blue-500/15 text-blue-400" :
                          gpType === "nintendo"    ? "bg-red-500/15 text-red-400" :
                          gpType === "xbox"        ? "bg-green-500/15 text-green-400" :
                          "bg-muted/40 text-muted-foreground",
                        ].join(" ")}>
                          {getControllerTypeBadge(gpType)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" className="h-8 gap-2 font-mono text-[10px] uppercase tracking-wider"
                        onClick={() => {
                          const actuator = (gp as any).vibrationActuator || (gp as any).hapticActuators?.[0];
                          if (actuator) actuator.playEffect("dual-rumble", { strongMagnitude: 1.0, weakMagnitude: 0.5, duration: 300 }).catch(() => {});
                          toast({ title: "Rumble Test", description: actuator ? "Rumble fired!" : "No rumble support on this controller." });
                        }}>
                        <Activity className="size-3" /> Test Rumble
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 gap-2 font-mono text-[10px] uppercase tracking-wider"
                        onClick={() => fetchAutoconfig(gp)} disabled={!!fetchingAutoconfig}>
                        {fetchingAutoconfig === gp.id ? <Loader2 className="size-3 animate-spin" /> : <Database className="size-3" />}
                        Fetch Autoconfig
                      </Button>
                    </div>
                  </div>
                  {/* Live button indicator grid */}
                  <div className="flex flex-wrap gap-1.5">
                    {gp.buttons.map((_, idx) => {
                      const btnLabel = getButtonLayout(gpType).find(b => b.index === idx)?.displayName ?? String(idx);
                      return (
                        <div key={idx} className={[
                          "min-w-[28px] h-7 px-1.5 rounded flex items-center justify-center font-mono text-[10px] border transition-all",
                          pressedButtons[gp.index]?.includes(idx)
                            ? "bg-primary border-primary text-primary-foreground scale-110 shadow-[0_0_12px_hsl(var(--primary))]"
                            : "bg-background/40 border-border text-muted-foreground",
                        ].join(" ")}>
                          {btnLabel}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── Keyboard & In-Game Hotkeys ───────────────────────────────────────── */}
      <Section title={t("settings.sections.shortcuts.title")} description={t("settings.sections.shortcuts.description")}>
        <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden space-y-0">

          {/* Keyboard shortcuts */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
            <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Keyboard className="size-4 text-primary" />
            </div>
            <div>
              <div className="font-display text-sm font-black uppercase tracking-wider">Keyboard</div>
              <div className="font-mono text-[10px] text-white/30">Navigation shortcuts</div>
            </div>
          </div>
          <div className="px-5 py-4 border-b border-white/5">
            <div className="space-y-2">
              {[
                { key: "WASD / Arrows", action: "Navigate grid" },
                { key: "Enter",         action: "Activate / Play" },
                { key: "Escape",        action: "Back / Close" },
                { key: "Space",         action: "Select" },
                { key: "/ or Ctrl+K",   action: "Focus search" },
                { key: "Tab",           action: "Switch views" },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-white/50">{action}</span>
                  <kbd className="shrink-0 px-2 py-1 rounded bg-white/5 border border-white/10 font-mono text-[11px] font-bold text-white/80">{key}</kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Gamepad navigation */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
            <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Gamepad2 className="size-4 text-primary" />
            </div>
            <div>
              <div className="font-display text-sm font-black uppercase tracking-wider">
                Gamepad Navigation
                {gamepads.length > 0 && (
                  <span className={[
                    "ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded normal-case tracking-normal",
                    primaryType === "playstation" ? "bg-blue-500/15 text-blue-400" :
                    primaryType === "nintendo"    ? "bg-red-500/15 text-red-400" :
                    primaryType === "xbox"        ? "bg-green-500/15 text-green-400" :
                    "bg-muted/40 text-muted-foreground",
                  ].join(" ")}>
                    {getControllerTypeBadge(primaryType)}
                  </span>
                )}
              </div>
              <div className="font-mono text-[10px] text-white/30">HomeArcade UI controls</div>
            </div>
          </div>
          <div className="px-5 py-4 border-b border-white/5">
            <div className="space-y-2">
              {[
                { key: "D-Pad",                                          action: "Navigate grid" },
                { key: primaryType === "playstation" ? "×" : primaryType === "nintendo" ? "B" : "A",    action: "Activate / Play" },
                { key: primaryType === "playstation" ? "○" : primaryType === "nintendo" ? "A" : "B",    action: "Back / Close" },
                { key: primaryType === "playstation" ? "□" : primaryType === "nintendo" ? "Y" : "X",    action: "Toggle Favorite" },
                { key: menuBtns.start,                                   action: "Open Settings" },
                { key: `${shoulder.l1} / ${shoulder.r1}`,               action: "Previous / Next system" },
              ].map(({ key, action }) => (
                <div key={action} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-white/50">{action}</span>
                  <kbd className="shrink-0 px-2 py-1 rounded bg-white/5 border border-white/10 font-mono text-[11px] font-bold text-white/80">{key}</kbd>
                </div>
              ))}
            </div>
          </div>

          {/* In-game hotkeys (RetroArch standard) */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
            <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="size-4 text-primary" />
            </div>
            <div>
              <div className="font-display text-sm font-black uppercase tracking-wider">In-Game Hotkeys</div>
              <div className="font-mono text-[10px] text-white/30">RetroArch standard combos</div>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="space-y-2">
              {RETROARCH_HOTKEYS.map((hotkey) => (
                <div key={hotkey.action} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-white/50">{hotkey.action}</span>
                  <kbd className="shrink-0 px-2 py-1 rounded bg-white/5 border border-white/10 font-mono text-[11px] font-bold text-white/80">
                    {getHotkeyCombo(hotkey, primaryType)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Button Mapping ───────────────────────────────────────────────────── */}
      <Section title={t("settings.sections.mapping.title")} description={t("settings.sections.mapping.description")}>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Remap controller buttons for navigating the HomeArcade interface. Click an action below to start the binding wizard.
          </p>
          <div className="flex flex-wrap gap-3">
            {([
              { id: "select",   label: "Select / Open" },
              { id: "back",     label: "Back / Close" },
              { id: "favorite", label: "Toggle Favorite" },
              { id: "menu",     label: "System Menu" },
            ] as const).map((action) => {
              const entry = config.uiGamepadMapping?.[action.id];
              const AXIS_LABELS: Record<number, string> = { 0: "L←→", 1: "L↑↓", 2: "R←→", 3: "R↑↓" };
              const label = entry?.kind === "button" && entry.buttonIndex !== undefined
                ? `→ ${getButtonLabel(entry.buttonIndex, primaryType)}`
                : entry?.kind === "axis" && entry.axisIndex !== undefined
                ? `→ ${AXIS_LABELS[entry.axisIndex] ?? `A${entry.axisIndex}`}${entry.direction === -1 ? "−" : "+"}`
                : "Not set";
              return (
                <button key={action.id} onClick={() => setShowRemapDialog(true)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-sidebar/20 hover:bg-sidebar/40 transition-colors text-left min-w-[200px]">
                  <div className="flex-1">
                    <div className="text-xs font-semibold">{action.label}</div>
                    <div className="text-[10px] text-muted-foreground font-mono uppercase">{label}</div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowRemapDialog(true)}
            className="w-full mt-2 py-3 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-medium text-muted-foreground hover:text-primary">
            Open Visual Remapper
          </button>
        </div>
      </Section>
    </div>
  );
}
