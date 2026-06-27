import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, apiUrl } from "@/lib/queryClient";
import { DirectoryPickerDialog } from "./DirectoryPickerDialog";
import { Loader2, FolderOpen, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

interface MoveAllResult {
  moved: number;
  skipped: number;
  failed: number;
  errors: string[];
}

interface MoveAllRomsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Phase = "pick" | "moving" | "done";

export function MoveAllRomsDialog({ open, onOpenChange }: MoveAllRomsDialogProps) {
  const [phase, setPhase] = useState<Phase>("pick");
  const [destPath, setDestPath] = useState<string | null>(null);
  const [destPickerOpen, setDestPickerOpen] = useState(false);
  const [result, setResult] = useState<MoveAllResult | null>(null);

  const { data: suggestedRoots } = useQuery<{ roots: { id: string; label: string; path: string; available: boolean }[] }>({
    queryKey: ["/api/filesystem/suggested-roots"],
  });

  const moveMutation = useMutation({
    mutationFn: async (dest: string) => {
      const res = await apiRequest("POST", "/api/roms/move-all", { dest });
      return res.json() as Promise<MoveAllResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      setPhase("done");
    },
    onError: (err: Error) => {
      setResult({ moved: 0, skipped: 0, failed: 1, errors: [err.message] });
      setPhase("done");
    },
  });

  const handleStart = () => {
    if (!destPath) return;
    setPhase("moving");
    moveMutation.mutate(destPath);
  };

  const handleClose = () => {
    if (phase === "moving") return;
    onOpenChange(false);
    setTimeout(() => {
      setPhase("pick");
      setDestPath(null);
      setResult(null);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-[#0c0c0c] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
            {phase === "pick" && <><FolderOpen className="size-5 text-accent" /> Move All ROMs</>}
            {phase === "moving" && <><Loader2 className="size-5 animate-spin text-accent" /> Moving ROMs…</>}
            {phase === "done" && <><CheckCircle2 className="size-5 text-accent" /> Move Complete</>}
          </DialogTitle>
          <DialogDescription className="text-white/45">
            {phase === "pick" && "Pick a destination directory. All ROMs will be organized into system subfolders (e.g. /dest/nes/, /dest/snes/)."}
            {phase === "moving" && "Copying files and updating the database. This may take a moment."}
            {phase === "done" && "The move operation has finished."}
          </DialogDescription>
        </DialogHeader>

        {phase === "pick" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              {destPath ? (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Destination</p>
                  <p className="font-mono text-xs text-foreground truncate">{destPath}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No destination selected yet.</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDestPickerOpen(true)}
                className="gap-1.5"
              >
                <FolderOpen className="size-3.5" />
                {destPath ? "Change" : "Choose Directory"}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!destPath}
                onClick={handleStart}
                className="gap-1.5 ml-auto"
              >
                <ArrowRight className="size-3.5" />
                Start Move
              </Button>
            </div>
          </div>
        )}

        {phase === "moving" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="size-8 animate-spin text-accent" />
            <p className="text-xs text-muted-foreground">Moving to {destPath}…</p>
          </div>
        )}

        {phase === "done" && result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-center">
                <div className="text-2xl font-black text-green-400">{result.moved}</div>
                <div className="text-[10px] uppercase tracking-widest text-green-400/60">Moved</div>
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
                <div className="text-2xl font-black text-blue-400">{result.skipped}</div>
                <div className="text-[10px] uppercase tracking-widest text-blue-400/60">Skipped</div>
              </div>
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-center">
                <div className="text-2xl font-black text-destructive">{result.failed}</div>
                <div className="text-[10px] uppercase tracking-widest text-destructive/60">Failed</div>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 max-h-40 overflow-y-auto space-y-1">
                {result.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] font-mono text-destructive">
                    <AlertCircle className="size-3 shrink-0 mt-0.5" />
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              className="w-full gap-1.5"
              onClick={handleClose}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>

      <DirectoryPickerDialog
        open={destPickerOpen}
        onOpenChange={setDestPickerOpen}
        onSelect={(p) => setDestPath(p)}
        title="Move ROMs to..."
        description="Select a destination directory. ROMs will be organized into system subfolders."
        suggestedRoots={suggestedRoots?.roots ?? []}
      />
    </Dialog>
  );
}
