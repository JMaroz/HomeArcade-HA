import { useState, useEffect, useCallback } from "react";

export type ActionId = "select" | "back" | "favorite" | "menu";

export type MappingEntry =
  | { kind: "button"; buttonIndex: number }
  | { kind: "axis"; axisIndex: number; direction: -1 | 1 };

export type ActionMapping = Record<string, MappingEntry | undefined>;

export type ControllerType = "xbox" | "playstation" | "nintendo" | "generic";

export interface ButtonState {
  index: number;
  label: string;
  pressed: boolean;
}

export interface GamepadButtonInfo {
  index: number;
  label: string;
  displayName: string;
  svgX: number;
  svgY: number;
}

export interface ControllerLayout {
  faceButtons: GamepadButtonInfo[];
  shoulderLabels: { left: string; right: string };
  stickLabels: { left: string; right: string };
  triggerLabels: { left: string; right: string };
}

// ── Button layouts ────────────────────────────────────────────────────────────

const XBOX_LAYOUT: GamepadButtonInfo[] = [
  { index: 0,  label: "a_btn",        displayName: "A",   svgX: 370, svgY: 315 },
  { index: 1,  label: "b_btn",        displayName: "B",   svgX: 420, svgY: 270 },
  { index: 2,  label: "x_btn",        displayName: "X",   svgX: 320, svgY: 270 },
  { index: 3,  label: "y_btn",        displayName: "Y",   svgX: 370, svgY: 225 },
  { index: 4,  label: "l_btn",        displayName: "LB",  svgX: 70,  svgY: 75  },
  { index: 5,  label: "r_btn",        displayName: "RB",  svgX: 450, svgY: 75  },
  { index: 6,  label: "start_btn",    displayName: "☰",   svgX: 300, svgY: 220 },
  { index: 7,  label: "select_btn",   displayName: "≡",   svgX: 220, svgY: 220 },
  { index: 8,  label: "l3_btn",       displayName: "L3",  svgX: 155, svgY: 235 },
  { index: 9,  label: "r3_btn",       displayName: "R3",  svgX: 365, svgY: 235 },
  { index: 10, label: "dpad_up",      displayName: "↑",   svgX: 80,  svgY: 195 },
  { index: 11, label: "dpad_down",    displayName: "↓",   svgX: 80,  svgY: 255 },
  { index: 12, label: "dpad_left",    displayName: "←",   svgX: 50,  svgY: 225 },
  { index: 13, label: "dpad_right",   displayName: "→",   svgX: 110, svgY: 225 },
];

const PS_LAYOUT: GamepadButtonInfo[] = [
  { index: 0,  label: "cross_btn",    displayName: "×",   svgX: 370, svgY: 315 },
  { index: 1,  label: "circle_btn",   displayName: "○",   svgX: 420, svgY: 270 },
  { index: 2,  label: "square_btn",   displayName: "□",   svgX: 320, svgY: 270 },
  { index: 3,  label: "triangle_btn", displayName: "△",   svgX: 370, svgY: 225 },
  { index: 4,  label: "l1_btn",       displayName: "L1",  svgX: 70,  svgY: 75  },
  { index: 5,  label: "r1_btn",       displayName: "R1",  svgX: 450, svgY: 75  },
  { index: 6,  label: "options_btn",  displayName: "OPT", svgX: 300, svgY: 220 },
  { index: 7,  label: "share_btn",    displayName: "SHR", svgX: 220, svgY: 220 },
  { index: 8,  label: "l3_btn",       displayName: "L3",  svgX: 155, svgY: 235 },
  { index: 9,  label: "r3_btn",       displayName: "R3",  svgX: 365, svgY: 235 },
  { index: 10, label: "dpad_up",      displayName: "↑",   svgX: 80,  svgY: 195 },
  { index: 11, label: "dpad_down",    displayName: "↓",   svgX: 80,  svgY: 255 },
  { index: 12, label: "dpad_left",    displayName: "←",   svgX: 50,  svgY: 225 },
  { index: 13, label: "dpad_right",   displayName: "→",   svgX: 110, svgY: 225 },
];

// Nintendo layout: A/B are swapped vs Xbox (B=confirm, A=cancel on Nintendo hardware,
// but the Web Gamepad API maps them to the same physical positions as Xbox)
const NINTENDO_LAYOUT: GamepadButtonInfo[] = [
  { index: 0,  label: "b_btn",        displayName: "B",   svgX: 370, svgY: 315 },
  { index: 1,  label: "a_btn",        displayName: "A",   svgX: 420, svgY: 270 },
  { index: 2,  label: "y_btn",        displayName: "Y",   svgX: 320, svgY: 270 },
  { index: 3,  label: "x_btn",        displayName: "X",   svgX: 370, svgY: 225 },
  { index: 4,  label: "l_btn",        displayName: "L",   svgX: 70,  svgY: 75  },
  { index: 5,  label: "r_btn",        displayName: "R",   svgX: 450, svgY: 75  },
  { index: 6,  label: "plus_btn",     displayName: "+",   svgX: 300, svgY: 220 },
  { index: 7,  label: "minus_btn",    displayName: "−",   svgX: 220, svgY: 220 },
  { index: 8,  label: "l3_btn",       displayName: "L3",  svgX: 155, svgY: 235 },
  { index: 9,  label: "r3_btn",       displayName: "R3",  svgX: 365, svgY: 235 },
  { index: 10, label: "dpad_up",      displayName: "↑",   svgX: 80,  svgY: 195 },
  { index: 11, label: "dpad_down",    displayName: "↓",   svgX: 80,  svgY: 255 },
  { index: 12, label: "dpad_left",    displayName: "←",   svgX: 50,  svgY: 225 },
  { index: 13, label: "dpad_right",   displayName: "→",   svgX: 110, svgY: 225 },
];

// ── RetroPad default physical-button maps per controller type ─────────────────
// Key = RetroPad button index, Value = physical Gamepad API button index
// Based on the RetroArch/RetroBat standard mapping table.
//
// RetroPad indices (EmulatorJS):
//   0=B  1=Y  2=Select  3=Start  4=Up  5=Down  6=Left  7=Right
//   8=A  9=X  10=L1  11=R1  12=L2  13=R2  14=L3  15=R3
export const RETROPAD_DEFAULTS: Record<ControllerType, Record<number, number>> = {
  xbox: {
    // RetroPad → Xbox physical (Web Gamepad Standard)
    0: 0,  // B  → A  (confirm)
    1: 2,  // Y  → X
    2: 8,  // Select → Back/View (idx 8 on standard mapping)
    3: 9,  // Start  → Menu/Start (idx 9)
    4: 12, // Up    → D-Up
    5: 13, // Down  → D-Down
    6: 14, // Left  → D-Left
    7: 15, // Right → D-Right
    8: 1,  // A  → B  (cancel)
    9: 3,  // X  → Y
    10: 4, // L1 → LB
    11: 5, // R1 → RB
    12: 6, // L2 → LT (axis, but some controllers report as button)
    13: 7, // R2 → RT
    14: 10, // L3
    15: 11, // R3
  },
  playstation: {
    0: 0,  // B  → × (Cross)
    1: 2,  // Y  → □ (Square)
    2: 8,  // Select → Share
    3: 9,  // Start  → Options
    4: 12, 5: 13, 6: 14, 7: 15,
    8: 1,  // A  → ○ (Circle)
    9: 3,  // X  → △ (Triangle)
    10: 4, // L1
    11: 5, // R1
    12: 6, // L2
    13: 7, // R2
    14: 10, 15: 11,
  },
  nintendo: {
    // Nintendo Switch Pro / 8BitDo in Switch mode
    // Physical layout: B=bottom, A=right, Y=left, X=top (opposite of Xbox)
    0: 1,  // RetroPad B → physical A (bottom-right on Switch = confirm)
    1: 3,  // RetroPad Y → physical X
    2: 8,  // Select → −
    3: 9,  // Start  → +
    4: 12, 5: 13, 6: 14, 7: 15,
    8: 0,  // RetroPad A → physical B
    9: 2,  // RetroPad X → physical Y
    10: 4, // L
    11: 5, // R
    12: 6, // ZL
    13: 7, // ZR
    14: 10, 15: 11,
  },
  generic: {
    0: 0, 1: 2, 2: 8,  3: 9,
    4: 12, 5: 13, 6: 14, 7: 15,
    8: 1,  9: 3, 10: 4, 11: 5,
    12: 6, 13: 7, 14: 10, 15: 11,
  },
};

// ── In-game hotkeys (RetroArch standard) ─────────────────────────────────────
// These are the standard RetroArch hotkey combos shown in the reference tab.
export interface HotkeyEntry {
  combo: string;
  action: string;
  comboPS?: string;    // PlayStation equivalent
  comboNintendo?: string; // Nintendo equivalent
}

export const RETROARCH_HOTKEYS: HotkeyEntry[] = [
  { combo: "Select + Start",   comboPS: "Share + Options", comboNintendo: "− + +",  action: "Quit game" },
  { combo: "Select + R1",      comboPS: "Share + R1",      comboNintendo: "− + R",  action: "Save state" },
  { combo: "Select + L1",      comboPS: "Share + L1",      comboNintendo: "− + L",  action: "Load state" },
  { combo: "Select + ↑ / ↓",   comboPS: "Share + ↑ / ↓",  comboNintendo: "− + ↑/↓", action: "Change save slot" },
  { combo: "Select + X",       comboPS: "Share + △",       comboNintendo: "− + X",  action: "Screenshot" },
  { combo: "Select + Y",       comboPS: "Share + □",       comboNintendo: "− + Y",  action: "Toggle fast-forward" },
  { combo: "Select + B",       comboPS: "Share + ○",       comboNintendo: "− + A",  action: "Hold to rewind" },
  { combo: "Select + A",       comboPS: "Share + ×",       comboNintendo: "− + B",  action: "Pause / resume" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Detect controller type from Gamepad ID string */
export function detectControllerType(id: string): ControllerType {
  const lower = id.toLowerCase();
  if (
    lower.includes("xbox") ||
    lower.includes("xinput") ||
    lower.includes("045e") // Microsoft VID
  ) return "xbox";
  if (
    lower.includes("dualshock") ||
    lower.includes("dualsense") ||
    lower.includes("playstation") ||
    lower.includes("054c") // Sony VID
  ) return "playstation";
  if (
    lower.includes("nintendo") ||
    lower.includes("switch pro") ||
    lower.includes("joy-con") ||
    lower.includes("8bitdo") ||
    lower.includes("pro controller") ||
    lower.includes("057e") // Nintendo VID
  ) return "nintendo";
  return "generic";
}

/** Get the button list for the controller type */
export function getButtonLayout(type: ControllerType): GamepadButtonInfo[] {
  if (type === "playstation") return PS_LAYOUT;
  if (type === "nintendo") return NINTENDO_LAYOUT;
  return XBOX_LAYOUT;
}

/** Get the shoulder/trigger labels for a controller type */
export function getShoulderLabels(type: ControllerType) {
  if (type === "playstation") return { l1: "L1", r1: "R1", l2: "L2", r2: "R2" };
  if (type === "nintendo")    return { l1: "L",  r1: "R",  l2: "ZL", r2: "ZR" };
  return                             { l1: "LB", r1: "RB", l2: "LT", r2: "RT" };
}

/** Get the start/select labels for a controller type */
export function getMenuLabels(type: ControllerType) {
  if (type === "playstation") return { start: "Options", select: "Share" };
  if (type === "nintendo")    return { start: "+",       select: "−" };
  return                             { start: "Start",   select: "Select" };
}

/** Get the hotkey combo string for the current controller type */
export function getHotkeyCombo(hotkey: HotkeyEntry, type: ControllerType): string {
  if (type === "playstation" && hotkey.comboPS) return hotkey.comboPS;
  if (type === "nintendo" && hotkey.comboNintendo) return hotkey.comboNintendo;
  return hotkey.combo;
}

/** Get the axis label for a given axis index and direction */
export function getAxisLabel(axisIndex: number, direction: -1 | 1, _type: ControllerType): string {
  const stick = axisIndex < 2 ? "L" : "R";
  const dir = axisIndex % 2 === 0
    ? (direction < 0 ? "←" : "→")
    : (direction < 0 ? "↑" : "↓");
  return `${stick}${dir}`;
}

/** Get all pressed button indices from a Gamepad */
export function getPressedButtons(gp: Gamepad): number[] {
  return gp.buttons.reduce<number[]>((acc, btn, i) => {
    if (btn.pressed) acc.push(i);
    return acc;
  }, []);
}

/** Find the primary (lowest index) pressed button from a Gamepad */
export function getPrimaryPressedButton(gp: Gamepad): number | null {
  for (let i = 0; i < gp.buttons.length; i++) {
    if (gp.buttons[i].pressed) return i;
  }
  return null;
}

export function useGamepadRemap() {
  const [listeningAction, setListeningAction] = useState<ActionId | null>(null);
  const [listenedBtn, setListenedBtn] = useState<number | null>(null);
  const [lastPressedLabel, setLastPressedLabel] = useState<string>("");

  const startListening = useCallback((action: ActionId) => {
    setListeningAction(action);
    setListenedBtn(null);
    setLastPressedLabel("");
  }, []);

  const stopListening = useCallback(() => {
    setListeningAction(null);
    setListenedBtn(null);
    setLastPressedLabel("");
  }, []);

  // Poll gamepads while listening
  useEffect(() => {
    if (!listeningAction) return;

    let rafId = 0;
    const DEAD_ZONE = 0.5;
    const tick = () => {
      const gps = navigator.getGamepads?.();
      for (const gp of gps ?? []) {
        if (!gp) continue;
        const btn = getPrimaryPressedButton(gp);
        if (btn !== null) {
          setListenedBtn(btn);
          const type = detectControllerType(gp.id);
          const layout = getButtonLayout(type);
          const info = layout.find(b => b.index === btn);
          setLastPressedLabel(info?.displayName ?? `BTN ${btn}`);
          break;
        }
        // Check axes
        for (let i = 0; i < gp.axes.length; i++) {
          const val = gp.axes[i];
          if (Math.abs(val) > DEAD_ZONE) {
            const direction: -1 | 1 = val > 0 ? 1 : -1;
            const encoded = i * 2 + (direction > 0 ? 1 : 0);
            setListenedBtn(encoded);
            const type = detectControllerType(gp.id);
            setLastPressedLabel(getAxisLabel(i, direction, type));
            break;
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [listeningAction]);

  return {
    listeningAction,
    listenedBtn,
    lastPressedLabel,
    startListening,
    stopListening,
  };
}
