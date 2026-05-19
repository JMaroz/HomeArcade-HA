import React, { useState, useEffect } from "react";
import type { ButtonState } from "./GamepadRemap";

interface MappingEntry {
  kind: "button" | "axis";
  buttonIndex?: number;
  axisIndex?: number;
  direction?: -1 | 1;
}

interface Props {
  activeButtons: ButtonState[];
  mapping: Record<string, MappingEntry | undefined>;
  listeningAction: string | null;
  listenedBtn: number | null;
  lastPressedLabel: string;
  onRemapAction: (actionId: string) => void;
  onDone: () => void;
  actions: { id: string; label: string; isAxis?: boolean }[];
}

export function ControllerRemapDialog({
  activeButtons,
  mapping,
  listeningAction,
  listenedBtn,
  lastPressedLabel,
  onRemapAction,
  onDone,
  actions,
}: Props) {
  const [axes, setAxes] = useState<Record<number, number>>({});

  // Live axis value display
  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      const gps = navigator.getGamepads?.();
      const vals: Record<number, number> = {};
      for (const gp of gps ?? []) {
        if (!gp) continue;
        for (let i = 0; i < gp.axes.length; i++) {
          vals[i] = gp.axes[i];
        }
        break;
      }
      setAxes(vals);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const XBOX_BUTTONS = [
    { index: 0,  label: "a_btn",     displayName: "A",     svgX: 370, svgY: 315 },
    { index: 1,  label: "b_btn",     displayName: "B",     svgX: 420, svgY: 270 },
    { index: 2,  label: "x_btn",     displayName: "X",     svgX: 320, svgY: 270 },
    { index: 3,  label: "y_btn",     displayName: "Y",     svgX: 370, svgY: 225 },
    { index: 4,  label: "l_btn",     displayName: "LB",    svgX: 70,  svgY: 75  },
    { index: 5,  label: "r_btn",     displayName: "RB",    svgX: 450, svgY: 75  },
    { index: 6,  label: "start_btn", displayName: "☰",     svgX: 300, svgY: 220 },
    { index: 7,  label: "select_btn",displayName: "≡",     svgX: 220, svgY: 220 },
    { index: 8,  label: "l3_btn",   displayName: "L3",    svgX: 155, svgY: 235 },
    { index: 9,  label: "r3_btn",   displayName: "R3",    svgX: 365, svgY: 235 },
    { index: 10, label: "dpad_up",   displayName: "↑",     svgX: 80,  svgY: 195 },
    { index: 11, label: "dpad_down", displayName: "↓",     svgX: 80,  svgY: 255 },
    { index: 12, label: "dpad_left", displayName: "←",     svgX: 50,  svgY: 225 },
    { index: 13, label: "dpad_right",displayName: "→",     svgX: 110, svgY: 225 },
  ];

  function getBtnState(idx: number): "active" | "mapped" | "listening" | "idle" {
    if (activeButtons.some(b => b.index === idx)) return "active";
    if (listeningAction !== null && listenedBtn === idx) return "listening";
    if (Object.values(mapping).some(m => m?.kind === "button" && m.buttonIndex === idx)) return "mapped";
    return "idle";
  }

  function getAxisState(axisIdx: number, dir: -1 | 1): "active" | "mapped" | "listening" | "idle" {
    const encoded = axisIdx * 2 + (dir > 0 ? 1 : 0);
    if (listeningAction !== null && listenedBtn === encoded) return "listening";
    if (Object.values(mapping).some(m => m?.kind === "axis" && m.axisIndex === axisIdx && m.direction === dir)) return "mapped";
    return "idle";
  }

  const mappedCount = Object.values(mapping).filter(Boolean).length;

  function entryLabel(entry: MappingEntry | undefined): string {
    if (!entry) return "Not set";
    if (entry.kind === "button") {
      const btn = XBOX_BUTTONS.find(b => b.index === entry.buttonIndex);
      return btn ? btn.displayName : `BTN ${entry.buttonIndex}`;
    }
    if (entry.kind === "axis") {
      const AXIS_NAMES: Record<number, string> = {
        0: "Left Stick ←→",
        1: "Left Stick ↑↓",
        2: "Right Stick ←→",
        3: "Right Stick ↑↓",
      };
      return `${AXIS_NAMES[entry.axisIndex ?? 0] ?? `Axis ${entry.axisIndex}`} ${entry.direction === -1 ? "-" : "+"}`;
    }
    return "Unknown";
  }

  // Encode a raw gamepad input into our mapping entry
  function encodeEntry(btn: number | null): MappingEntry | null {
    if (btn === null) return null;
    // Encoded: button index * 2+1 for positive direction, button index * 2 for negative
    // If btn < 256, it's a raw button index
    // If btn >= 256, it's an encoded axis entry
    if (btn < 256) return { kind: "button", buttonIndex: btn };
    const axisIdx = Math.floor(btn / 2);
    const dir: -1 | 1 = btn % 2 === 0 ? -1 : 1;
    return { kind: "axis", axisIndex: axisIdx, direction: dir };
  }

  return (
    <div className="space-y-6">
      {/* Status bar */}
      {listeningAction ? (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/40 bg-primary/10">
          <div className="size-3 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium">
            Press any button on your controller to assign it to{" "}
            <strong className="text-primary">
              {actions.find(a => a.id === listeningAction)?.label}
            </strong>
          </span>
          {lastPressedLabel && (
            <span className="ml-auto font-display text-xl font-black text-primary">
              {lastPressedLabel}
            </span>
          )}
          <button
            onClick={onDone}
            className="ml-4 px-3 py-1 rounded-lg border border-white/20 text-xs font-medium hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          {mappedCount}/{actions.length} actions mapped — click an action to rebind, or press a button on your controller.
        </div>
      )}

      {/* SVG Controller Diagram */}
      <div className="relative mx-auto" style={{ width: 520, height: 420 }}>
        <svg
          viewBox="0 0 520 420"
          className="w-full h-full drop-shadow-2xl"
          aria-label="Gamepad diagram"
        >
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="50%" stopColor="#1a1a1a" />
              <stop offset="100%" stopColor="#141414" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="5" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Controller body */}
          <rect x="20" y="30" width="480" height="320" rx="80" ry="80" fill="#1a1a1a" stroke="#2e2e2e" strokeWidth="3" />
          <rect x="20" y="30" width="480" height="320" rx="80" ry="80" fill="url(#bodyGrad)" />

          {/* Left grip */}
          <ellipse cx="100" cy="310" rx="50" ry="65" fill="#141414" />
          <ellipse cx="100" cy="310" rx="40" ry="55" fill="#1e1e1e" stroke="#252525" strokeWidth="2" />

          {/* Right grip */}
          <ellipse cx="420" cy="310" rx="50" ry="65" fill="#141414" />
          <ellipse cx="420" cy="310" rx="40" ry="55" fill="#1e1e1e" stroke="#252525" strokeWidth="2" />

          {/* Left stick */}
          <circle cx="155" cy="190" r="42" fill="#111" stroke="#2a2a2a" strokeWidth="2" />
          <circle
            cx="155" cy="190" r="28"
            fill={getBtnState(8) === "active" || getBtnState(8) === "listening" ? "#b05dfc" : "#1e1e1e"}
            stroke={getBtnState(8) === "listening" ? "#b05dfc" : "#333"}
            strokeWidth={getBtnState(8) === "listening" ? 3 : 2}
            filter={getBtnState(8) === "active" || getBtnState(8) === "listening" ? "url(#glow)" : undefined}
          />
          <text x="155" y="194" textAnchor="middle" fill="#555" fontSize="11" fontFamily="sans-serif">L3</text>

          {/* Right stick */}
          <circle cx="365" cy="190" r="42" fill="#111" stroke="#2a2a2a" strokeWidth="2" />
          <circle
            cx="365" cy="190" r="28"
            fill={getBtnState(9) === "active" || getBtnState(9) === "listening" ? "#b05dfc" : "#1e1e1e"}
            stroke={getBtnState(9) === "listening" ? "#b05dfc" : "#333"}
            strokeWidth={getBtnState(9) === "listening" ? 3 : 2}
            filter={getBtnState(9) === "active" || getBtnState(9) === "listening" ? "url(#glow)" : undefined}
          />
          <text x="365" y="194" textAnchor="middle" fill="#555" fontSize="11" fontFamily="sans-serif">R3</text>

          {/* D-pad */}
          <g>
            <rect x="65" y="170" width="30" height="30" rx="4"
              fill={getBtnState(10) === "active" || getBtnState(10) === "listening" ? "#b05dfc" : "#1c1c1c"}
              stroke={getBtnState(10) === "listening" ? "#b05dfc" : "#2e2e2e"}
              strokeWidth={getBtnState(10) === "listening" ? 2 : 1}
              filter={getBtnState(10) === "active" || getBtnState(10) === "listening" ? "url(#glow)" : undefined}
            />
            <text x="80" y="190" textAnchor="middle" fill="#555" fontSize="14" fontFamily="sans-serif">↑</text>
            <rect x="65" y="230" width="30" height="30" rx="4"
              fill={getBtnState(11) === "active" || getBtnState(11) === "listening" ? "#b05dfc" : "#1c1c1c"}
              stroke={getBtnState(11) === "listening" ? "#b05dfc" : "#2e2e2e"}
              strokeWidth={getBtnState(11) === "listening" ? 2 : 1}
              filter={getBtnState(11) === "active" || getBtnState(11) === "listening" ? "url(#glow)" : undefined}
            />
            <text x="80" y="250" textAnchor="middle" fill="#555" fontSize="14" fontFamily="sans-serif">↓</text>
            <rect x="35" y="200" width="30" height="30" rx="4"
              fill={getBtnState(12) === "active" || getBtnState(12) === "listening" ? "#b05dfc" : "#1c1c1c"}
              stroke={getBtnState(12) === "listening" ? "#b05dfc" : "#2e2e2e"}
              strokeWidth={getBtnState(12) === "listening" ? 2 : 1}
              filter={getBtnState(12) === "active" || getBtnState(12) === "listening" ? "url(#glow)" : undefined}
            />
            <text x="50" y="218" textAnchor="middle" fill="#555" fontSize="14" fontFamily="sans-serif">←</text>
            <rect x="95" y="200" width="30" height="30" rx="4"
              fill={getBtnState(13) === "active" || getBtnState(13) === "listening" ? "#b05dfc" : "#1c1c1c"}
              stroke={getBtnState(13) === "listening" ? "#b05dfc" : "#2e2e2e"}
              strokeWidth={getBtnState(13) === "listening" ? 2 : 1}
              filter={getBtnState(13) === "active" || getBtnState(13) === "listening" ? "url(#glow)" : undefined}
            />
            <text x="110" y="218" textAnchor="middle" fill="#555" fontSize="14" fontFamily="sans-serif">→</text>
          </g>

          {/* Center buttons */}
          <circle cx="220" cy="220" r="14"
            fill={getBtnState(7) === "active" || getBtnState(7) === "listening" ? "#b05dfc" : "#1c1c1c"}
            stroke={getBtnState(7) === "listening" ? "#b05dfc" : "#2e2e2e"}
            strokeWidth={getBtnState(7) === "listening" ? 2 : 1}
            filter={getBtnState(7) === "active" || getBtnState(7) === "listening" ? "url(#glow)" : undefined}
          />
          <text x="220" y="224" textAnchor="middle" fill="#555" fontSize="8" fontFamily="sans-serif">≡</text>
          <circle cx="300" cy="220" r="14"
            fill={getBtnState(6) === "active" || getBtnState(6) === "listening" ? "#b05dfc" : "#1c1c1c"}
            stroke={getBtnState(6) === "listening" ? "#b05dfc" : "#2e2e2e"}
            strokeWidth={getBtnState(6) === "listening" ? 2 : 1}
            filter={getBtnState(6) === "active" || getBtnState(6) === "listening" ? "url(#glow)" : undefined}
          />
          <text x="300" y="224" textAnchor="middle" fill="#555" fontSize="9" fontFamily="sans-serif">☰</text>

          {/* XYAB */}
          {[
            { btn: XBOX_BUTTONS[3], label: "Y" },
            { btn: XBOX_BUTTONS[2], label: "X" },
            { btn: XBOX_BUTTONS[1], label: "B" },
            { btn: XBOX_BUTTONS[0], label: "A" },
          ].map(({ btn, label }) => {
            const state = getBtnState(btn.index);
            const isActive = state === "active";
            const isListening = state === "listening";
            const isMapped = state === "mapped";
            return (
              <g key={btn.index}>
                <circle
                  cx={btn.svgX} cy={btn.svgY} r={isListening ? 26 : 22}
                  fill={isActive ? "#b05dfc" : isListening ? "#7c3aed" : isMapped ? "#2a2a2a" : "#1e1e1e"}
                  stroke={isListening ? "#b05dfc" : isMapped ? "#444" : "#333"}
                  strokeWidth={isListening ? 3 : 2}
                  filter={isActive || isListening ? "url(#glow)" : undefined}
                  className="transition-all duration-150"
                />
                <text
                  x={btn.svgX} y={btn.svgY + 5}
                  textAnchor="middle"
                  fill={isActive || isListening ? "#fff" : "#888"}
                  fontSize={isListening ? "15" : "13"}
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* LB / RB */}
          <rect x="30" y="60" width="90" height="30" rx="10"
            fill={getBtnState(4) === "active" || getBtnState(4) === "listening" ? "#b05dfc" : "#1c1c1c"}
            stroke={getBtnState(4) === "listening" ? "#b05dfc" : "#2e2e2e"}
            strokeWidth={getBtnState(4) === "listening" ? 2 : 1}
            filter={getBtnState(4) === "active" || getBtnState(4) === "listening" ? "url(#glow)" : undefined}
          />
          <text x="75" y="80" textAnchor="middle" fill={getBtnState(4) === "active" || getBtnState(4) === "listening" ? "#fff" : "#555"} fontSize="11" fontFamily="sans-serif">LB</text>
          <rect x="400" y="60" width="90" height="30" rx="10"
            fill={getBtnState(5) === "active" || getBtnState(5) === "listening" ? "#b05dfc" : "#1c1c1c"}
            stroke={getBtnState(5) === "listening" ? "#b05dfc" : "#2e2e2e"}
            strokeWidth={getBtnState(5) === "listening" ? 2 : 1}
            filter={getBtnState(5) === "active" || getBtnState(5) === "listening" ? "url(#glow)" : undefined}
          />
          <text x="445" y="80" textAnchor="middle" fill={getBtnState(5) === "active" || getBtnState(5) === "listening" ? "#fff" : "#555"} fontSize="11" fontFamily="sans-serif">RB</text>

          {/* Axis indicators — live fill for left stick */}
          {axes[0] !== undefined && (
            <text x="155" y="380" textAnchor="middle" fill="#444" fontSize="10" fontFamily="monospace">
              {axes[0] > 0.5 ? "→" : axes[0] < -0.5 ? "←" : "·"}
            </text>
          )}
          {axes[1] !== undefined && (
            <text x="180" y="365" textAnchor="middle" fill="#444" fontSize="10" fontFamily="monospace">
              {axes[1] > 0.5 ? "↓" : axes[1] < -0.5 ? "↑" : "·"}
            </text>
          )}
          {axes[2] !== undefined && (
            <text x="365" y="380" textAnchor="middle" fill="#444" fontSize="10" fontFamily="monospace">
              {axes[2] > 0.5 ? "→" : axes[2] < -0.5 ? "←" : "·"}
            </text>
          )}
          {axes[3] !== undefined && (
            <text x="390" y="365" textAnchor="middle" fill="#444" fontSize="10" fontFamily="monospace">
              {axes[3] > 0.5 ? "↓" : axes[3] < -0.5 ? "↑" : "·"}
            </text>
          )}

          {/* Axis binding hotspots */}
          {listeningAction && (() => {
            const HOTSPOTS = [
              { axisIdx: 0, dir: -1 as -1, label: "L←", x: 20, y: 160, w: 40, h: 40 },
              { axisIdx: 0, dir:  1 as -1, label: "L→", x: 60, y: 160, w: 40, h: 40 },
              { axisIdx: 1, dir: -1 as -1, label: "L↑", x: 20, y: 120, w: 40, h: 40 },
              { axisIdx: 1, dir:  1 as -1, label: "L↓", x: 20, y: 200, w: 40, h: 40 },
              { axisIdx: 2, dir: -1 as -1, label: "R←", x: 360, y: 160, w: 40, h: 40 },
              { axisIdx: 2, dir:  1 as -1, label: "R→", x: 400, y: 160, w: 40, h: 40 },
              { axisIdx: 3, dir: -1 as -1, label: "R↑", x: 360, y: 120, w: 40, h: 40 },
              { axisIdx: 3, dir:  1 as -1, label: "R↓", x: 360, y: 200, w: 40, h: 40 },
            ];
            return HOTSPOTS.map(h => {
              const state = getAxisState(h.axisIdx, h.dir);
              const isActive = state === "active";
              const isListening = state === "listening";
              const isMapped = state === "mapped";
              return (
                <g key={`${h.axisIdx}-${h.dir}`}>
                  <rect
                    x={h.x} y={h.y} width={h.w} height={h.h} rx="6"
                    fill={isActive ? "#b05dfc" : isListening ? "#7c3aed" : isMapped ? "#2a2a2a" : "#111"}
                    stroke={isListening ? "#b05dfc" : isMapped ? "#444" : "#2a2a2a"}
                    strokeWidth={isListening ? 2 : 1}
                    filter={isActive || isListening ? "url(#glow)" : undefined}
                    className="cursor-pointer transition-all duration-150"
                    onClick={() => {
                      // Encode axis as encoded value and pass to onRemapAction
                      const encoded = h.axisIdx * 2 + (h.dir > 0 ? 1 : 0);
                      // Trigger immediate commit
                      const entry: MappingEntry = { kind: "axis", axisIndex: h.axisIdx, direction: h.dir };
                      const currentAction = listeningAction;
                      if (currentAction) {
                        const mapping = { ...(mapping || {}) };
                        mapping[currentAction] = entry;
                        // Actually, the onRemapAction call is just for starting the listen
                        // The actual binding is done by the poll loop below
                        onRemapAction(currentAction);
                      }
                    }}
                  />
                  <text
                    x={h.x + h.w / 2} y={h.y + h.h / 2 + 4}
                    textAnchor="middle"
                    fill={isActive || isListening ? "#fff" : "#555"}
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {h.label}
                  </text>
                </g>
              );
            });
          })()}

          {/* LT / RT labels */}
          <text x="75" y="52" textAnchor="middle" fill="#333" fontSize="9" fontFamily="monospace">LT</text>
          <text x="445" y="52" textAnchor="middle" fill="#333" fontSize="9" fontFamily="monospace">RT</text>
        </svg>
      </div>

      {/* Action list */}
      <div className="grid gap-3">
        {actions.map(action => {
          const entry = mapping[action.id];
          const isListening = listeningAction === action.id;

          return (
            <div
              key={action.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                isListening
                  ? "border-primary bg-primary/10"
                  : entry
                  ? "border-border bg-sidebar/20"
                  : "border-border/50 bg-sidebar/10 opacity-60"
              }`}
            >
              <div className="space-y-0.5">
                <div className="text-sm font-semibold">{action.label}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {entryLabel(entry)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {entry && !isListening && (
                  <div className="size-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center">
                    <span className="text-primary font-black text-xs">
                      {entry.kind === "button" ? (XBOX_BUTTONS.find(b => b.index === entry.buttonIndex)?.displayName ?? "?") : entry.kind === "axis" ? `A${entry.axisIndex}` : "?"}
                    </span>
                  </div>
                )}
                {isListening && listenedBtn !== null && (
                  <div className="size-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
                    <span className="text-primary-foreground font-black text-sm">{lastPressedLabel}</span>
                  </div>
                )}
                <button
                  onClick={() => onRemapAction(action.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                    isListening
                      ? "bg-primary text-primary-foreground"
                      : "border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {isListening ? "Waiting..." : entry ? "Remap" : "Assign"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}