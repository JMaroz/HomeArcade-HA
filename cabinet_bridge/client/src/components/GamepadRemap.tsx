import { useState, useEffect, useCallback } from "react";

export type ActionId = "select" | "back" | "favorite" | "menu";

export interface ButtonState {
  index: number;
  label: string;
  pressed: boolean;
}

export interface GamepadButtonInfo {
  index: number;
  label: string;
  // Human-readable name based on controller type
  displayName: string;
  svgX: number;
  svgY: number;
}

const XBOX_LAYOUT: GamepadButtonInfo[] = [
  { index: 0,  label: "a_btn",       displayName: "A",           svgX: 370, svgY: 310 },
  { index: 1,  label: "b_btn",       displayName: "B",           svgX: 420, svgY: 270 },
  { index: 2,  label: "x_btn",       displayName: "X",           svgX: 320, svgY: 270 },
  { index: 3,  label: "y_btn",       displayName: "Y",           svgX: 370, svgY: 230 },
  { index: 4,  label: "l_btn",       displayName: "LB",          svgX: 80,  svgY: 80  },
  { index: 5,  label: "r_btn",       displayName: "RB",           svgX: 440, svgY: 80  },
  { index: 6,  label: "start_btn",   displayName: "Menu",         svgX: 290, svgY: 215 },
  { index: 7,  label: "select_btn",  displayName: "View",         svgX: 230, svgY: 215 },
  { index: 8,  label: "l3_btn",      displayName: "L3",          svgX: 155, svgY: 230 },
  { index: 9,  label: "r3_btn",      displayName: "R3",           svgX: 365, svgY: 230 },
  { index: 10, label: "dpad_up",     displayName: "↑",            svgX: 85,  svgY: 210 },
  { index: 11, label: "dpad_down",   displayName: "↓",            svgX: 85,  svgY: 260 },
  { index: 12, label: "dpad_left",   displayName: "←",            svgX: 55,  svgY: 235 },
  { index: 13, label: "dpad_right",  displayName: "→",            svgX: 115, svgY: 235 },
];

/** Detect controller type from Gamepad ID string */
export function detectControllerType(id: string): "xbox" | "playstation" | "generic" {
  const lower = id.toLowerCase();
  if (lower.includes("xbox") || lower.includes("360") || lower.includes("dualshock") === false && /vendor:\s*045e|pid:\s*0b/i.test(id)) return "xbox";
  if (lower.includes("dualshock") || lower.includes("playstation") || lower.includes("dualsense")) return "playstation";
  return "generic";
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
    const tick = () => {
      const gps = navigator.getGamepads?.();
      for (const gp of gps ?? []) {
        if (!gp) continue;
        const btn = getPrimaryPressedButton(gp);
        if (btn !== null) {
          setListenedBtn(btn);
          // Look up display name
          const info = XBOX_LAYOUT.find(b => b.index === btn);
          setLastPressedLabel(info?.displayName ?? `BTN ${btn}`);
          break;
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