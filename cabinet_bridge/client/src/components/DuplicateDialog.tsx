import { useState } from "react";
import type { UploadedRom } from "@shared/schema";

export type DuplicateAction = "keep" | "replace" | "skip";

export interface DuplicateEntry {
  originalName: string;
  size: number;
  existingRom: UploadedRom;
}

interface DuplicateDialogProps {
  duplicates: DuplicateEntry[];
  onConfirm: (actions: Map<string, DuplicateAction>) => void;
  onCancel: () => void;
}

const ACTION_LABELS: Record<DuplicateAction, string> = {
  keep: "Keep Both",
  replace: "Replace",
  skip: "Skip",
};

export function DuplicateDialog({ duplicates, onConfirm, onCancel }: DuplicateDialogProps) {
  const [applyAll, setApplyAll] = useState<DuplicateAction | null>(null);
  const [actions, setActions] = useState<Map<string, DuplicateAction>>(() => {
    const m = new Map<string, DuplicateAction>();
    for (const d of duplicates) m.set(d.originalName, "keep");
    return m;
  });

  const setAction = (name: string, action: DuplicateAction) => {
    if (applyAll) setApplyAll(null);
    setActions((prev) => {
      const next = new Map(prev);
      next.set(name, action);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border border-border bg-background p-5 shadow-xl space-y-4">
        <div>
          <h3 className="font-display text-sm font-semibold tracking-tight">Duplicate ROMs Detected</h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            {duplicates.length} file{duplicates.length !== 1 ? "s" : ""} already exist in your library.
            Choose what to do with each:
          </p>
        </div>

        {/* Apply-all toggle */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <span className="mr-1">Apply to all:</span>
          {(["keep", "replace", "skip"] as DuplicateAction[]).map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => {
                const newVal = applyAll === action ? null : action;
                setApplyAll(newVal);
                if (newVal) {
                  setActions((prev) => {
                    const next = new Map(prev);
                    for (const d of duplicates) next.set(d.originalName, newVal);
                    return next;
                  });
                }
              }}
              className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border transition-colors ${
                applyAll === action
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted-foreground hover:border-accent/50"
              }`}
            >
              {ACTION_LABELS[action]}
            </button>
          ))}
        </div>

        {/* Per-file list */}
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {duplicates.map((dup) => {
            const current = actions.get(dup.originalName) ?? "keep";
            return (
              <div
                key={dup.originalName}
                className="rounded border border-border bg-card/50 p-2.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono truncate">{dup.originalName}</span>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {dup.existingRom.title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                  {(["keep", "replace", "skip"] as DuplicateAction[]).map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => setAction(dup.originalName, action)}
                      className={`px-2 py-0.5 rounded uppercase tracking-wider border transition-colors ${
                        current === action
                          ? action === "keep"
                            ? "border-accent bg-accent/10 text-accent"
                            : action === "replace"
                            ? "border-status-warning bg-status-warning/10 text-status-warning"
                            : "border-destructive/50 bg-destructive/10 text-destructive"
                          : "border-border text-muted-foreground hover:border-accent/50"
                      }`}
                    >
                      {ACTION_LABELS[action]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border hover:border-accent/50 transition-colors"
          >
            Cancel Upload
          </button>
          <button
            type="button"
            onClick={() => onConfirm(actions)}
            className="px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
