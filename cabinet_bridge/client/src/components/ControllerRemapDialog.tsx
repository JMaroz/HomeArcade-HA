import React from "react";
import type { GamepadButtonInfo, ButtonState } from "./GamepadRemap";

interface Props {
  /** Buttons to show as "active" (just pressed) */
  activeButtons: ButtonState[];
  /** Currently mapped button indices per action */
  mapping: Record<string, number | undefined>;
  /** Which action is currently being remapped (listening) */
  listeningAction: string | null;
  /** The button index that was just registered in listening mode */
  listenedBtn: number | null;
  /** Display name for the listened button */
  lastPressedLabel: string;
  /** Triggered when user clicks a button on the diagram to start remapping */
  onRemapAction: (actionId: string) => void;
  /** Triggered when user clicks "Done" or presses Escape */
  onDone: () => void;
  actions: { id: string; label: string }[];
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
  const XBOX_BUTTONS: GamepadButtonInfo[] = [
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
    if (Object.values(mapping).includes(idx)) return "mapped";
    return "idle";
  }

  const mappedCount = Object.values(mapping).filter(Boolean).length;

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
          {mappedCount}/{actions.length} actions mapped — click an action below, then press the controller button you want to assign.
        </div>
      )}

      {/* SVG Controller Diagram */}
      <div className="relative mx-auto" style={{ width: 520, height: 380 }}>
        <svg
          viewBox="0 0 520 380"
          className="w-full h-full drop-shadow-2xl"
          aria-label="Gamepad diagram"
        >
          {/* ── Controller body ─────────────────────────────────────────── */}
          <rect x="20" y="30" width="480" height="320" rx="80" ry="80" fill="#1a1a1a" stroke="#2e2e2e" strokeWidth="3" />
          {/* Body gradient overlay */}
          <rect x="20" y="30" width="480" height="320" rx="80" ry="80" fill="url(#bodyGrad)" />

          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="50%" stopColor="#1a1a1a" />
              <stop offset="100%" stopColor="#141414" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── Left grip ──────────────────────────────────────────────── */}
          <ellipse cx="100" cy="310" rx="50" ry="65" fill="#141414" />
          <ellipse cx="100" cy="310" rx="40" ry="55" fill="#1e1e1e" stroke="#252525" strokeWidth="2" />

          {/* ── Right grip ────────────────────────────────────────────── */}
          <ellipse cx="420" cy="310" rx="50" ry="65" fill="#141414" />
          <ellipse cx="420" cy="310" rx="40" ry="55" fill="#1e1e1e" stroke="#252525" strokeWidth="2" />

          {/* ── Left stick housing ─────────────────────────────────────── */}
          <circle cx="155" cy="190" r="42" fill="#111" stroke="#2a2a2a" strokeWidth="2" />
          <circle
            cx="155" cy="190" r="28"
            fill={getBtnState(8) === "active" || getBtnState(8) === "listening" ? "#b05dfc" : "#1e1e1e"}
            stroke={getBtnState(8) === "listening" ? "#b05dfc" : "#333"}
            strokeWidth={getBtnState(8) === "listening" ? 3 : 2}
            filter={getBtnState(8) === "active" || getBtnState(8) === "listening" ? "url(#glow)" : undefined}
            className="cursor-pointer"
            onClick={() => listeningAction === null && onRemapAction(listeningAction ?? "")}
          />
          <text x="155" y="194" textAnchor="middle" fill="#555" fontSize="11" fontFamily="sans-serif">L3</text>

          {/* ── Right stick housing ───────────────────────────────────── */}
          <circle cx="365" cy="190" r="42" fill="#111" stroke="#2a2a2a" strokeWidth="2" />
          <circle
            cx="365" cy="190" r="28"
            fill={getBtnState(9) === "active" || getBtnState(9) === "listening" ? "#b05dfc" : "#1e1e1e"}
            stroke={getBtnState(9) === "listening" ? "#b05dfc" : "#333"}
            strokeWidth={getBtnState(9) === "listening" ? 3 : 2}
            filter={getBtnState(9) === "active" || getBtnState(9) === "listening" ? "url(#glow)" : undefined}
          />
          <text x="365" y="194" textAnchor="middle" fill="#555" fontSize="11" fontFamily="sans-serif">R3</text>

          {/* ── D-pad ────────────────────────────────────────────────── */}
          <g>
            {/* Up */}
            <rect x="65" y="170" width="30" height="30" rx="4"
              fill={getBtnState(10) === "active" || getBtnState(10) === "listening" ? "#b05dfc" : "#1c1c1c"}
              stroke={getBtnState(10) === "listening" ? "#b05dfc" : "#2e2e2e"}
              strokeWidth={getBtnState(10) === "listening" ? 2 : 1}
              filter={getBtnState(10) === "active" || getBtnState(10) === "listening" ? "url(#glow)" : undefined}
            />
            <text x="80" y="190" textAnchor="middle" fill="#555" fontSize="14" fontFamily="sans-serif">↑</text>
            {/* Down */}
            <rect x="65" y="230" width="30" height="30" rx="4"
              fill={getBtnState(11) === "active" || getBtnState(11) === "listening" ? "#b05dfc" : "#1c1c1c"}
              stroke={getBtnState(11) === "listening" ? "#b05dfc" : "#2e2e2e"}
              strokeWidth={getBtnState(11) === "listening" ? 2 : 1}
              filter={getBtnState(11) === "active" || getBtnState(11) === "listening" ? "url(#glow)" : undefined}
            />
            <text x="80" y="250" textAnchor="middle" fill="#555" fontSize="14" fontFamily="sans-serif">↓</text>
            {/* Left */}
            <rect x="35" y="200" width="30" height="30" rx="4"
              fill={getBtnState(12) === "active" || getBtnState(12) === "listening" ? "#b05dfc" : "#1c1c1c"}
              stroke={getBtnState(12) === "listening" ? "#b05dfc" : "#2e2e2e"}
              strokeWidth={getBtnState(12) === "listening" ? 2 : 1}
              filter={getBtnState(12) === "active" || getBtnState(12) === "listening" ? "url(#glow)" : undefined}
            />
            <text x="50" y="218" textAnchor="middle" fill="#555" fontSize="14" fontFamily="sans-serif">←</text>
            {/* Right */}
            <rect x="95" y="200" width="30" height="30" rx="4"
              fill={getBtnState(13) === "active" || getBtnState(13) === "listening" ? "#b05dfc" : "#1c1c1c"}
              stroke={getBtnState(13) === "listening" ? "#b05dfc" : "#2e2e2e"}
              strokeWidth={getBtnState(13) === "listening" ? 2 : 1}
              filter={getBtnState(13) === "active" || getBtnState(13) === "listening" ? "url(#glow)" : undefined}
            />
            <text x="110" y="218" textAnchor="middle" fill="#555" fontSize="14" fontFamily="sans-serif">→</text>
          </g>

          {/* ── Center buttons ────────────────────────────────────────── */}
          {/* View */}
          <circle cx="220" cy="220" r="14"
            fill={getBtnState(7) === "active" || getBtnState(7) === "listening" ? "#b05dfc" : "#1c1c1c"}
            stroke={getBtnState(7) === "listening" ? "#b05dfc" : "#2e2e2e"}
            strokeWidth={getBtnState(7) === "listening" ? 2 : 1}
            filter={getBtnState(7) === "active" || getBtnState(7) === "listening" ? "url(#glow)" : undefined}
          />
          <text x="220" y="224" textAnchor="middle" fill="#555" fontSize="8" fontFamily="sans-serif">≡</text>
          {/* Menu */}
          <circle cx="300" cy="220" r="14"
            fill={getBtnState(6) === "active" || getBtnState(6) === "listening" ? "#b05dfc" : "#1c1c1c"}
            stroke={getBtnState(6) === "listening" ? "#b05dfc" : "#2e2e2e"}
            strokeWidth={getBtnState(6) === "listening" ? 2 : 1}
            filter={getBtnState(6) === "active" || getBtnState(6) === "listening" ? "url(#glow)" : undefined}
          />
          <text x="300" y="224" textAnchor="middle" fill="#555" fontSize="9" fontFamily="sans-serif">☰</text>

          {/* ── XYAB face buttons ─────────────────────────────────────── */}
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
                  fill={
                    isActive ? "#b05dfc"
                    : isListening ? "#7c3aed"
                    : isMapped ? "#2a2a2a"
                    : "#1e1e1e"
                  }
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

          {/* ── Bumper buttons ─────────────────────────────────────────── */}
          {/* LB */}
          <rect x="30" y="60" width="90" height="30" rx="10"
            fill={getBtnState(4) === "active" || getBtnState(4) === "listening" ? "#b05dfc" : "#1c1c1c"}
            stroke={getBtnState(4) === "listening" ? "#b05dfc" : "#2e2e2e"}
            strokeWidth={getBtnState(4) === "listening" ? 2 : 1}
            filter={getBtnState(4) === "active" || getBtnState(4) === "listening" ? "url(#glow)" : undefined}
          />
          <text x="75" y="80" textAnchor="middle" fill={getBtnState(4) === "active" || getBtnState(4) === "listening" ? "#fff" : "#555"} fontSize="11" fontFamily="sans-serif">LB</text>
          {/* RB */}
          <rect x="400" y="60" width="90" height="30" rx="10"
            fill={getBtnState(5) === "active" || getBtnState(5) === "listening" ? "#b05dfc" : "#1c1c1c"}
            stroke={getBtnState(5) === "listening" ? "#b05dfc" : "#2e2e2e"}
            strokeWidth={getBtnState(5) === "listening" ? 2 : 1}
            filter={getBtnState(5) === "active" || getBtnState(5) === "listening" ? "url(#glow)" : undefined}
          />
          <text x="445" y="80" textAnchor="middle" fill={getBtnState(5) === "active" || getBtnState(5) === "listening" ? "#fff" : "#555"} fontSize="11" fontFamily="sans-serif">RB</text>

          {/* ── Trigger labels (decorative) ───────────────────────────── */}
          <text x="75" y="52" textAnchor="middle" fill="#333" fontSize="9" fontFamily="monospace">LT</text>
          <text x="445" y="52" textAnchor="middle" fill="#333" fontSize="9" fontFamily="monospace">RT</text>
        </svg>

        {/* Hotspot overlays — invisible click targets over each button */}
        {XBOX_BUTTONS.map(btn => {
          const isListening = listeningAction !== null;
          if (!isListening) return null;
          return (
            <button
              key={btn.index}
              onClick={() => {
                if (listeningAction) onRemapAction(listeningAction);
              }}
              className="absolute bg-transparent cursor-pointer rounded-full"
              style={{
                left: btn.svgX - 24,
                top: btn.svgY - 24,
                width: 48,
                height: 48,
              }}
              aria-label={`Select button ${btn.displayName}`}
            />
          );
        })}
      </div>

      {/* Action list */}
      <div className="grid gap-3">
        {actions.map(action => {
          const mappedIdx = mapping[action.id];
          const mappedBtn = XBOX_BUTTONS.find(b => b.index === mappedIdx);
          const isListening = listeningAction === action.id;

          return (
            <div
              key={action.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                isListening
                  ? "border-primary bg-primary/10"
                  : mappedIdx !== undefined
                  ? "border-border bg-sidebar/20"
                  : "border-border/50 bg-sidebar/10 opacity-60"
              }`}
            >
              <div className="space-y-0.5">
                <div className="text-sm font-semibold">{action.label}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {mappedBtn ? `Button: ${mappedBtn.displayName}` : "Not set"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {mappedBtn && !isListening && (
                  <div className="size-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center">
                    <span className="text-primary font-black text-sm">{mappedBtn.displayName}</span>
                  </div>
                )}
                {isListening && listenedBtn !== null && (
                  <div className="size-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
                    <span className="text-primary-foreground font-black text-sm">
                      {XBOX_BUTTONS.find(b => b.index === listenedBtn)?.displayName ?? listenedBtn}
                    </span>
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
                  {isListening ? "Waiting..." : mappedIdx !== undefined ? "Remap" : "Assign"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}