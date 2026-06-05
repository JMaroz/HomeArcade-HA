import React, { useState, useEffect, useCallback } from "react";
import { useIntegration } from "@/lib/integration";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  detectControllerType,
  getButtonLayout,
  getShoulderLabels,
  getMenuLabels,
  getHotkeyCombo,
  RETROPAD_DEFAULTS,
  RETROARCH_HOTKEYS,
  useGamepadRemap,
  type ControllerType,
  type MappingEntry,
} from "@/components/GamepadRemap";
import {
  Gamepad2, Activity, Database, Keyboard, Loader2, Zap, RotateCcw,
} from "lucide-react";
import { Section } from "./SettingsShared";
import { useProfile } from "@/lib/useProfile";
import { apiRequest } from "@/lib/queryClient";
import { ControllerRemapDialog } from "@/components/ControllerRemapDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

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

const RETROPAD_ACTIONS = [
  { id: "8", label: "Button A (Confirm / RetroPad A)" },
  { id: "0", label: "Button B (Cancel / RetroPad B)" },
  { id: "9", label: "Button X (RetroPad X)" },
  { id: "1", label: "Button Y (RetroPad Y)" },
  { id: "2", label: "Select (RetroPad Select)" },
  { id: "3", label: "Start (RetroPad Start)" },
  { id: "4", label: "D-Pad Up (RetroPad Up)" },
  { id: "5", label: "D-Pad Down (RetroPad Down)" },
  { id: "6", label: "D-Pad Left (RetroPad Left)" },
  { id: "7", label: "D-Pad Right (RetroPad Right)" },
  { id: "10", label: "L1 Shoulder (RetroPad L1)" },
  { id: "11", label: "R1 Shoulder (RetroPad R1)" },
  { id: "12", label: "L2 Trigger (RetroPad L2)" },
  { id: "13", label: "R2 Trigger (RetroPad R2)" },
  { id: "14", label: "L3 Analog Click (RetroPad L3)" },
  { id: "15", label: "R3 Analog Click (RetroPad R3)" },
];

const UI_ACTIONS = [
  { id: "select", label: "Menu Select / Confirm" },
  { id: "back", label: "Menu Back / Cancel" },
  { id: "favorite", label: "Menu Toggle Favorite" },
  { id: "menu", label: "Menu Open Settings" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ControlsSettings() {
  const { config, setConfig } = useIntegration();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currentProfileId } = useProfile();
  const [gamepads, setGamepads] = useState<Gamepad[]>([]);
  const [pressedButtons, setPressedButtons] = useState<Record<number, number[]>>({});
  const [fetchingAutoconfig, setFetchingAutoconfig] = useState<string | null>(null);

  // ── Remapping Modal State ──────────────────────────────────────────────────
  const [selectedGamepad, setSelectedGamepad] = useState<Gamepad | null>(null);
  const [remapPort, setRemapPort] = useState<number>(0);
  const [remapTab, setRemapTab] = useState<"gameplay" | "navigation">("gameplay");
  const [mappings, setMappings] = useState<Record<string, MappingEntry | undefined>>({});

  const {
    listeningAction,
    listenedEntry,
    lastPressedLabel,
    startListening,
    stopListening,
  } = useGamepadRemap(selectedGamepad?.id);

  // Load existing bindings for selected controller
  useEffect(() => {
    if (!selectedGamepad) return;
    const loadMappings = async () => {
      try {
        if (remapTab === "navigation") {
          setMappings((config.uiGamepadMapping || {}) as Record<string, MappingEntry | undefined>);
        } else {
          const portQuery = remapPort === 1 ? "?port=1" : "";
          const res = await fetch(
            apiUrl(
              `/api/profiles/${currentProfileId}/gamepad-bindings/${encodeURIComponent(selectedGamepad.id)}${portQuery}`
            )
          );
          if (res.ok) {
            const data = await res.json();
            setMappings(data || {});
          } else {
            setMappings({});
          }
        }
      } catch (err) {
        console.error("Failed to load controller bindings:", err);
      }
    };
    loadMappings();
  }, [selectedGamepad, remapPort, remapTab, currentProfileId, config.uiGamepadMapping]);

  // Commit binding when listenedEntry changes
  useEffect(() => {
    if (listeningAction && listenedEntry && selectedGamepad) {
      const next = { ...mappings, [listeningAction]: listenedEntry };
      setMappings(next);
      stopListening();

      if (remapTab === "navigation") {
        setConfig({ uiGamepadMapping: next as any });
      } else {
        const portQuery = remapPort === 1 ? "?port=1" : "";
        apiRequest(
          "PUT",
          `/api/profiles/${currentProfileId}/gamepad-bindings/${encodeURIComponent(selectedGamepad.id)}${portQuery}`,
          next
        ).catch((err) => {
          console.error("Failed to save gameplay bindings:", err);
        });
      }

      toast({
        title: "Binding Updated",
        description: `Mapped "${lastPressedLabel}" to "${
          remapTab === "navigation"
            ? UI_ACTIONS.find(a => a.id === listeningAction)?.label
            : RETROPAD_ACTIONS.find(a => a.id === listeningAction)?.label
        }"`,
      });
    }
  }, [
    listenedEntry,
    listeningAction,
    remapTab,
    mappings,
    selectedGamepad,
    remapPort,
    currentProfileId,
    stopListening,
    setConfig,
    lastPressedLabel,
    toast,
  ]);

  const handleReset = async () => {
    if (!selectedGamepad) return;
    try {
      if (remapTab === "navigation") {
        const defaults = {
          select:   { kind: "button", buttonIndex: 0 },
          back:     { kind: "button", buttonIndex: 1 },
          favorite: { kind: "button", buttonIndex: 3 },
          menu:     { kind: "button", buttonIndex: 9 },
        };
        setConfig({ uiGamepadMapping: defaults as any });
        setMappings(defaults as any);
        toast({ title: "Reset Complete", description: "UI navigation mappings reset to defaults." });
      } else {
        const portQuery = remapPort === 1 ? "?port=1" : "";
        await apiRequest(
          "DELETE",
          `/api/profiles/${currentProfileId}/gamepad-bindings/${encodeURIComponent(selectedGamepad.id)}${portQuery}`
        );
        setMappings({});
        toast({ title: "Reset Complete", description: "Gameplay bindings reset to default." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Reset Failed", description: String(err) });
    }
  };

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
                      <Button variant="outline" size="sm" className="h-8 gap-2 font-mono text-[10px] uppercase tracking-wider text-primary border-primary/30 hover:bg-primary/10"
                        onClick={() => {
                          setSelectedGamepad(gp);
                          setRemapPort(0);
                        }}>
                        <Gamepad2 className="size-3" /> Remap P1
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 gap-2 font-mono text-[10px] uppercase tracking-wider text-primary border-primary/30 hover:bg-primary/10"
                        onClick={() => {
                          setSelectedGamepad(gp);
                          setRemapPort(1);
                        }}>
                        <Gamepad2 className="size-3" /> Remap P2
                      </Button>
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
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Keyboard className="size-4 text-primary" />
              </div>
              <div>
                <div className="font-display text-sm font-black uppercase tracking-wider">Keyboard</div>
                <div className="font-mono text-[10px] text-white/30">Navigation shortcuts</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 font-mono text-[10px] uppercase tracking-wider text-primary border-primary/30 hover:bg-primary/10"
              onClick={() => {
                setSelectedGamepad({ id: "keyboard", index: -1 } as Gamepad);
                setRemapPort(0);
              }}
            >
              <Keyboard className="size-3" /> Remap Keyboard
            </Button>
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

      {/* ── Remapping Modal ─────────────────────────────────────────────────── */}
      <Dialog open={!!selectedGamepad} onOpenChange={(open) => !open && setSelectedGamepad(null)}>
        <DialogContent className="sm:max-w-2xl bg-[#0c0c0c] border-white/10 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center justify-between">
              <span>Remap Controller</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/20 text-primary">
                Player {remapPort + 1}
              </span>
            </DialogTitle>
            <DialogDescription className="text-white/40">
              Customize controls for "{selectedGamepad?.id}"
            </DialogDescription>
          </DialogHeader>

          <Tabs value={remapTab} onValueChange={(v) => setRemapTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-xl">
              <TabsTrigger value="gameplay" className="rounded-lg text-xs font-bold uppercase tracking-wider">Gameplay Controls</TabsTrigger>
              <TabsTrigger value="navigation" className="rounded-lg text-xs font-bold uppercase tracking-wider">UI Menu Navigation</TabsTrigger>
            </TabsList>
            
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" className="h-8 gap-2 font-mono text-[10px] uppercase tracking-wider text-destructive border-destructive/20 hover:bg-destructive/10 animate-in fade-in"
                onClick={handleReset}>
                <RotateCcw className="size-3" /> Reset to Defaults
              </Button>
            </div>

            <TabsContent value="gameplay" className="mt-4">
              {selectedGamepad && (
                <ControllerRemapDialog
                  activeButtons={(pressedButtons[selectedGamepad.index] || []).map((idx) => ({
                    index: idx,
                    label: `BTN ${idx}`,
                    pressed: true,
                  }))}
                  mapping={mappings}
                  listeningAction={listeningAction}
                  listenedEntry={listenedEntry}
                  lastPressedLabel={lastPressedLabel}
                  onRemapAction={startListening}
                  onDone={stopListening}
                  actions={RETROPAD_ACTIONS}
                  gamepadId={selectedGamepad.id}
                  onApplyTemplate={async (template) => {
                    setMappings(template);
                    const portQuery = remapPort === 1 ? "?port=1" : "";
                    await apiRequest(
                      "PUT",
                      `/api/profiles/${currentProfileId}/gamepad-bindings/${encodeURIComponent(selectedGamepad.id)}${portQuery}`,
                      template
                    );
                    toast({
                      title: "Template Applied",
                      description: "The mapping template has been successfully loaded and saved.",
                    });
                  }}
                />
              )}
            </TabsContent>
            
            <TabsContent value="navigation" className="mt-4">
              {selectedGamepad && (
                <ControllerRemapDialog
                  activeButtons={(pressedButtons[selectedGamepad.index] || []).map((idx) => ({
                    index: idx,
                    label: `BTN ${idx}`,
                    pressed: true,
                  }))}
                  mapping={mappings}
                  listeningAction={listeningAction}
                  listenedEntry={listenedEntry}
                  lastPressedLabel={lastPressedLabel}
                  onRemapAction={startListening}
                  onDone={stopListening}
                  actions={UI_ACTIONS}
                  gamepadId={selectedGamepad.id}
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
