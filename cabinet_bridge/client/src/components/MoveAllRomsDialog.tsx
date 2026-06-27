import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { apiRequest, apiUrl } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DirectoryPickerDialog } from "./DirectoryPickerDialog";
import { Loader2, FolderOpen, CheckCircle2, AlertCircle, ArrowRight, HardDrive, Database, AlertTriangle, Trash2 } from "lucide-react";
import { SYSTEMS } from "@/data/library";

interface SystemBreakdown {
  system: string;
  count: number;
  size: number;
}

interface MoveStats {
  total: number;
  totalSize: number;
  systems: SystemBreakdown[];
  source: { path: string; disk: { freeBytes: number; totalBytes: number } | null };
  dest: { path: string; disk: { freeBytes: number; totalBytes: number } | null } | null;
}

interface MoveAllResult {
  moved: number;
  skipped: number;
  failed: number;
  errors: string[];
}

type Phase = "pick" | "moving" | "done";

function fmtBytes(bytes: number): string {
  if (bytes >= 1 << 30) return `${(bytes / (1 << 30)).toFixed(1)} GB`;
  if (bytes >= 1 << 20) return `${(bytes / (1 << 20)).toFixed(0)} MB`;
  if (bytes >= 1 << 10) return `${(bytes / (1 << 10)).toFixed(0)} KB`;
  return `${bytes} B`;
}

function systemLabel(slug: string): string {
  const found = SYSTEMS.find((s) => s.id === slug);
  return found?.shortName ?? slug.toUpperCase();
}

export function MoveAllRomsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("pick");
  const [destPath, setDestPath] = useState<string | null>(null);
  const [destPickerOpen, setDestPickerOpen] = useState(false);
  const [result, setResult] = useState<MoveAllResult | null>(null);
  const [cleanupResult, setCleanupResult] = useState<{ removed: number; directories: string[]; errors?: string[] } | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<MoveStats>({
    queryKey: ["/api/roms/move-stats", destPath],
    queryFn: async () => {
      const params = destPath ? `?dest=${encodeURIComponent(destPath)}` : "";
      const res = await fetch(apiUrl(`/api/roms/move-stats${params}`));
      return res.json() as Promise<MoveStats>;
    },
  });

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

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/roms/move-cleanup");
      return res.json() as Promise<{ removed: number; directories: string[]; errors?: string[] }>;
    },
    onSuccess: (data) => {
      setCleanupResult(data);
      toast({ title: "Cleanup complete", description: `Removed ${data.removed} empty director${data.removed === 1 ? "y" : "ies"}.` });
    },
    onError: (err) => {
      toast({ title: "Cleanup failed", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (open) {
      setPhase("pick");
      setDestPath(null);
      setResult(null);
      setCleanupResult(null);
    }
  }, [open]);

  const handleStart = () => {
    if (!destPath) return;
    setPhase("moving");
    moveMutation.mutate(destPath);
  };

  const handleClose = () => {
    if (phase === "moving") return;
    onOpenChange(false);
  };

  const destFreeOk = stats?.dest?.disk && stats?.totalSize
    ? stats.dest.disk.freeBytes >= stats.totalSize
    : true;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-[#0c0c0c] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
            {phase === "pick" && <><FolderOpen className="size-5 text-accent" /> Move All ROMs</>}
            {phase === "moving" && <><Loader2 className="size-5 animate-spin text-accent" /> Moving ROMs…</>}
            {phase === "done" && <><CheckCircle2 className="size-5 text-accent" /> Move Complete</>}
          </DialogTitle>
          <DialogDescription className="text-white/45">
            {phase === "pick" && "All ROMs will be moved to the destination, organized into system subfolders."}
            {phase === "moving" && "Copying files and updating the database."}
            {phase === "done" && "The move operation has finished."}
          </DialogDescription>
        </DialogHeader>

        {phase === "pick" && (
          <div className="space-y-4">
            {/* ROM library summary */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Database className="size-3.5" />
                ROM Library
              </div>

              {statsLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Loading stats…
                </div>
              ) : stats ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                      <div className="text-lg font-black text-foreground">{stats.total.toLocaleString()}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total ROMs</div>
                    </div>
                    <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                      <div className="text-lg font-black text-foreground">{fmtBytes(stats.totalSize)}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Size</div>
                    </div>
                  </div>

                  {stats.systems.length > 0 && (
                    <>
                      <Separator className="bg-white/5" />
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Breakdown by System</div>
                      <ScrollArea className="max-h-40">
                        <div className="space-y-1">
                          {stats.systems.map((sys) => (
                            <div key={sys.system} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/[0.02]">
                              <div className="flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-accent shrink-0" />
                                <span className="text-xs font-medium">{systemLabel(sys.system)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                                <span>{sys.count} ROMs</span>
                                <span>{fmtBytes(sys.size)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </>
                  )}
                </>
              ) : null}
            </div>

            {/* Source directory */}
            {stats?.source && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <HardDrive className="size-3.5" />
                  Source Directory
                </div>
                <p className="font-mono text-[11px] text-foreground truncate">{stats.source.path}</p>
                {stats.source.disk && (
                  <div className="text-[10px] text-muted-foreground font-mono">
                    Free: {fmtBytes(stats.source.disk.freeBytes)} / {fmtBytes(stats.source.disk.totalBytes)}
                  </div>
                )}
              </div>
            )}

            {/* Destination */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <FolderOpen className="size-3.5" />
                Destination
              </div>
              {destPath ? (
                <>
                  <p className="font-mono text-[11px] text-foreground truncate">{destPath}</p>
                  {stats?.dest?.disk && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Free: {fmtBytes(stats.dest.disk.freeBytes)} / {fmtBytes(stats.dest.disk.totalBytes)}
                      </span>
                      {!destFreeOk && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-destructive">
                          <AlertTriangle className="size-3" />
                          Low space
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setDestPickerOpen(true)} className="gap-1.5">
                      <FolderOpen className="size-3.5" />
                      Change
                    </Button>
                    <Button type="button" size="sm" onClick={handleStart} disabled={!destFreeOk} className="gap-1.5 ml-auto">
                      <ArrowRight className="size-3.5" />
                      Start Move
                    </Button>
                  </div>
                </>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => setDestPickerOpen(true)} className="gap-1.5">
                  <FolderOpen className="size-3.5" />
                  Choose Directory
                </Button>
              )}
            </div>

            {!destFreeOk && destPath && (
              <div className="flex items-start gap-2 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-[11px]">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>Destination does not have enough free space ({stats?.dest?.disk ? fmtBytes(stats.dest.disk.freeBytes) : "unknown"} free, need {stats ? fmtBytes(stats.totalSize) : "unknown"}).</span>
              </div>
            )}
          </div>
        )}

        {phase === "moving" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="size-8 animate-spin text-accent" />
            <p className="text-xs text-muted-foreground">Moving {stats?.total ?? "…"} ROMs to {destPath}…</p>
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

            {result.moved > 0 && result.failed === 0 && !cleanupResult && (
              <Button
                type="button"
                variant="destructive"
                className="w-full gap-1.5"
                onClick={() => cleanupMutation.mutate()}
                disabled={cleanupMutation.isPending}
              >
                {cleanupMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                Delete source folder
              </Button>
            )}

            {cleanupResult && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-green-500 uppercase tracking-wider">
                  <CheckCircle2 className="size-4" />
                  Source directory cleaned
                </div>
                <p className="text-[10px] font-mono text-green-400/70 mt-1">
                  Removed {cleanupResult.removed} empty director{cleanupResult.removed === 1 ? "y" : "ies"}.
                </p>
                {cleanupResult.errors && cleanupResult.errors.length > 0 && (
                  <div className="mt-2 text-[10px] font-mono text-destructive">
                    {cleanupResult.errors.map((e, i) => <div key={i}>{e}</div>)}
                  </div>
                )}
              </div>
            )}

            <Button type="button" className="w-full gap-1.5" onClick={handleClose}>
              {cleanupResult ? "Close" : "Done"}
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
