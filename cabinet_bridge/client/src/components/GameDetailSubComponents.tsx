/**
 * Sub-components used by GameDetailDialog.
 * Extracted to keep GameDetailDialog.tsx focused on its core logic.
 */
import React, { useState } from "react";
import { Save, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import type { RomSaveSlot, GameCheatCode } from "@shared/schema";
import { apiUrl } from "@/lib/queryClient";

// ── Stat card ──────────────────────────────────────────────────────────────────

export function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/50 px-2.5 py-2">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] truncate">{label}</span>
      </div>
      <div className="mt-1 font-mono text-xs font-semibold text-foreground truncate">{value}</div>
    </div>
  );
}

// ── HLTB stat card ─────────────────────────────────────────────────────────────

export function HltbStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/50 px-2.5 py-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground truncate mb-1">{label}</div>
      <div className="font-mono text-xs font-semibold text-foreground">{value}</div>
    </div>
  );
}

// ── Save slot card ─────────────────────────────────────────────────────────────

export function SaveSlotCard({ slot, romId, onDelete }: { slot: RomSaveSlot; romId: number; onDelete: () => void }) {
  const [thumbError, setThumbError] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const thumbUrl = apiUrl(`/api/roms/${romId}/save-thumb/${slot.slot}`);

  const timeAgo = (() => {
    const diffMs = Date.now() - slot.updatedAt;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  })();

  return (
    <div className="group relative rounded-lg border border-border bg-background/70 overflow-hidden w-[88px] shrink-0">
      <div className="relative w-full aspect-video bg-muted flex items-center justify-center">
        {!thumbError ? (
          <img src={thumbUrl} alt={`Slot ${slot.slot}`} className="w-full h-full object-cover" onError={() => setThumbError(true)} decoding="async" />
        ) : (
          <Save className="size-5 text-muted-foreground/40" />
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {confirming ? (
            <div className="flex flex-col items-center gap-1">
              <button type="button" onClick={onDelete} className="text-[9px] font-mono uppercase tracking-wider text-red-400 hover:text-red-300">Delete?</button>
              <button type="button" onClick={() => setConfirming(false)} className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="rounded-full bg-black/60 p-1.5 text-white/70 hover:text-white transition-colors" aria-label="Delete save state">
              <Trash2 className="size-3" />
            </button>
          )}
        </div>
      </div>
      <div className="px-1.5 py-1">
        <div className="font-mono text-[9px] font-semibold text-foreground truncate">{slot.label}</div>
        <div className="font-mono text-[8px] text-muted-foreground/60 truncate">{timeAgo}</div>
      </div>
    </div>
  );
}

// ── Cheat row ──────────────────────────────────────────────────────────────────

export function CheatRow({ cheat, onToggle, onDelete }: { cheat: GameCheatCode; onToggle: () => void; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-2">
      <button type="button" onClick={onToggle} aria-pressed={cheat.enabled} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors" aria-label={cheat.enabled ? "Disable cheat" : "Enable cheat"}>
        {cheat.enabled ? <ToggleRight className="size-5 text-primary" /> : <ToggleLeft className="size-5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`font-mono text-[11px] font-semibold truncate ${cheat.enabled ? "text-foreground" : "text-muted-foreground/50"}`}>{cheat.description}</div>
        <div className="font-mono text-[9px] text-muted-foreground/50 truncate tracking-wider">{cheat.code}</div>
      </div>
      {confirming ? (
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={onDelete} className="font-mono text-[9px] uppercase tracking-wider text-red-400 hover:text-red-300">Delete?</button>
          <button type="button" onClick={() => setConfirming(false)} className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground">Cancel</button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="shrink-0 rounded border border-border bg-background/70 p-1 text-muted-foreground/50 hover:text-destructive hover:border-destructive/40 transition-colors" aria-label="Delete cheat">
          <Trash2 className="size-3" />
        </button>
      )}
    </div>
  );
}
