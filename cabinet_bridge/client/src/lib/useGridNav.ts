import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Keyboard + gamepad navigation for a CSS-grid of game cards.
 *
 * Controls
 * ─────────────────────────────────────────────────────────────
 * Arrow keys   – move focus through the grid
 * Enter / A    – open the focused card (onActivate)
 * F / Y        – toggle favourite (onFav)
 * Gamepad      – D-pad or left stick for movement, A=open, Y=fav
 *
 * Returns { focusedIndex } — pass as a prop to each card.
 * focusedIndex is -1 when navigation is inactive (no key pressed yet).
 */
export function useGridNav({
  count,
  gridRef,
  onActivate,
  onFav,
  onFocusChange,
  onExit,
  disabled = false,
  mapping = { select: { kind: "button", buttonIndex: 0 }, favorite: { kind: "button", buttonIndex: 3 } },
}: {
  count: number;
  gridRef: React.RefObject<HTMLElement | null>;
  onActivate: (index: number) => void;
  onFav: (index: number) => void;
  onFocusChange?: (index: number) => void;
  onExit?: (dir: "left" | "right" | "up" | "down") => void;
  disabled?: boolean;
  mapping?: Record<string, any>;
}) {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Keep refs so RAF callbacks always see latest values without re-creating
  const focusedRef = useRef(focusedIndex);
  const countRef = useRef(count);
  const disabledRef = useRef(disabled);
  const mappingRef = useRef(mapping);
  const onFocusChangeRef = useRef(onFocusChange);
  const onActivateRef = useRef(onActivate);
  const onFavRef = useRef(onFav);
  const onExitRef = useRef(onExit);
  
  focusedRef.current = focusedIndex;
  onExitRef.current = onExit;
  countRef.current = count;
  disabledRef.current = disabled;
  mappingRef.current = mapping;
  onFocusChangeRef.current = onFocusChange;
  onActivateRef.current = onActivate;
  onFavRef.current = onFav;

  // Reset focus when games list changes length (new filter, search, etc.)
  useEffect(() => {
    setFocusedIndex(-1);
    onFocusChangeRef.current?.(-1);
  }, [count]);

  // ── Column count ────────────────────────────────────────────────────────────
  const getColumns = useCallback(() => {
    if (!gridRef.current) return 1;
    const cols = getComputedStyle(gridRef.current)
      .gridTemplateColumns.trim()
      .split(/\s+/).length;
    return Math.max(1, cols);
  }, [gridRef]);

  // ── Scroll focused card into view ───────────────────────────────────────────
  const scrollIntoView = useCallback(
    (idx: number) => {
      const child = gridRef.current?.children[idx] as HTMLElement | undefined;
      child?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    },
    [gridRef],
  );

  // ── Move helper (shared by keyboard + gamepad) ──────────────────────────────
  const move = useCallback(
    (dir: "up" | "down" | "left" | "right") => {
      if (disabledRef.current || countRef.current === 0) return;
      const cols = getColumns();
      const cur = focusedRef.current < 0 ? -1 : focusedRef.current;
      let next: number;

      if (cur < 0) {
        // First interaction — jump to first card
        next = dir === "up" || dir === "left" ? countRef.current - 1 : 0;
      } else {
        switch (dir) {
          case "right": 
            if (cur + 1 >= countRef.current) {
              onExitRef.current?.("right");
              return;
            }
            next = cur + 1; 
            break;
          case "left":  
            if (cur % cols === 0) {
              onExitRef.current?.("left");
              return;
            }
            next = Math.max(0, cur - 1); 
            break;
          case "down":  
            if (cur + cols >= countRef.current) {
              onExitRef.current?.("down");
              return;
            }
            next = cur + cols; 
            break;
          case "up":    
            if (cur - cols < 0) {
              onExitRef.current?.("up");
              return;
            }
            next = cur - cols; 
            break;
        }
      }

      setFocusedIndex(next);
      onFocusChangeRef.current?.(next);
      scrollIntoView(next);
    },
    [getColumns, scrollIntoView],
  );

  // ── Keyboard handler ────────────────────────────────────────────────────────
  useEffect(() => {
    if (disabled) return;

    const handler = (e: KeyboardEvent) => {
      // Don't steal keys while an input/textarea is focused
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "ArrowRight": e.preventDefault(); move("right"); break;
        case "ArrowLeft":  e.preventDefault(); move("left");  break;
        case "ArrowDown":  e.preventDefault(); move("down");  break;
        case "ArrowUp":    e.preventDefault(); move("up");    break;
        case "Enter":
          if (focusedRef.current >= 0) { e.preventDefault(); onActivateRef.current?.(focusedRef.current); }
          break;
        case "f":
        case "F":
          if (focusedRef.current >= 0) { e.preventDefault(); onFavRef.current?.(focusedRef.current); }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [disabled, move]);

  // ── Gamepad polling ─────────────────────────────────────────────────────────
  useEffect(() => {
    const DEAD_ZONE = 0.4;
    const REPEAT_DELAY = 450;   // ms before auto-repeat starts
    const REPEAT_RATE  = 130;   // ms between repeats

    let rafId = 0;
    let heldDir: "up" | "down" | "left" | "right" | null = null;
    let holdStart = 0;
    let lastRepeat = 0;
    let prevSelect = false;
    let prevFav = false;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      if (disabledRef.current) return;

      const gp = navigator.getGamepads?.().find((g) => g !== null);
      if (!gp) return;

      const up    = gp.buttons[12]?.pressed || gp.axes[1] < -DEAD_ZONE;
      const down  = gp.buttons[13]?.pressed || gp.axes[1] >  DEAD_ZONE;
      const left  = gp.buttons[14]?.pressed || gp.axes[0] < -DEAD_ZONE;
      const right = gp.buttons[15]?.pressed || gp.axes[0] >  DEAD_ZONE;
      const dir: typeof heldDir = up ? "up" : down ? "down" : left ? "left" : right ? "right" : null;

      if (dir !== heldDir) {
        heldDir = dir;
        holdStart = now;
        lastRepeat = 0;
        if (dir) move(dir);
      } else if (dir) {
        const elapsed = now - holdStart;
        if (elapsed > REPEAT_DELAY && now - lastRepeat > REPEAT_RATE) {
          lastRepeat = now;
          move(dir);
        }
      }

  const m = mappingRef.current;

      // Resolve select button — support both old number and new entry format
      const selectEntry = m?.select;
      const selectBtnIdx = typeof selectEntry === "number"
        ? selectEntry
        : selectEntry?.kind === "button" ? selectEntry.buttonIndex
        : 0;
      const selectAxisIdx = typeof selectEntry !== "number" && selectEntry?.kind === "axis" ? selectEntry.axisIndex : undefined;
      const selectAxisDir = typeof selectEntry !== "number" && selectEntry?.kind === "axis" ? selectEntry.direction : undefined;

      // Resolve favorite button
      const favEntry = m?.favorite;
      const favBtnIdx = typeof favEntry === "number"
        ? favEntry
        : favEntry?.kind === "button" ? favEntry.buttonIndex
        : 3;
      const favAxisIdx = typeof favEntry !== "number" && favEntry?.kind === "axis" ? favEntry.axisIndex : undefined;
      const favAxisDir = typeof favEntry !== "number" && favEntry?.kind === "axis" ? favEntry.direction : undefined;

      // Check button for select
      const selectPressed = gp.buttons[selectBtnIdx ?? 0]?.pressed ?? false;
      // Check axis for select
      const selectAxisPressed = selectAxisIdx !== undefined && selectAxisDir !== undefined
        ? (selectAxisDir > 0 ? gp.axes[selectAxisIdx] > 0.5 : gp.axes[selectAxisIdx] < -0.5)
        : false;
      if ((selectPressed || selectAxisPressed) && !prevSelect && focusedRef.current >= 0) {
        onActivateRef.current?.(focusedRef.current);
      }
      prevSelect = selectPressed || selectAxisPressed;

      // Check button for favorite
      const favPressed = gp.buttons[favBtnIdx ?? 3]?.pressed ?? false;
      // Check axis for favorite
      const favAxisPressed = favAxisIdx !== undefined && favAxisDir !== undefined
        ? (favAxisDir > 0 ? gp.axes[favAxisIdx] > 0.5 : gp.axes[favAxisIdx] < -0.5)
        : false;
      if ((favPressed || favAxisPressed) && !prevFav && focusedRef.current >= 0) {
        onFavRef.current?.(focusedRef.current);
      }
      prevFav = favPressed || favAxisPressed;
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [move]);

  return { focusedIndex, setFocusedIndex };
}
