import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, HardDrive, FolderOpen, Database, ImageIcon, RefreshCw, Server, Trash2 } from "lucide-react";
import { apiRequest, apiUrl } from "@/lib/queryClient";
import { SYSTEMS } from "@/data/library";

interface SystemBreakdown {
  system: string;
  count: number;
  size: number;
}

interface StorageSnapshot {
  totalRoms: number;
  totalSize: number;
  bySystem: SystemBreakdown[];
  romStorage: {
    path: string;
    usedBytes: number;
    disk: { freeBytes: number; totalBytes: number } | null;
  };
  watchPaths: {
    path: string;
    count: number;
    size: number;
    imported: number;
  }[];
  systemImageCache: {
    path: string;
    size: number;
  };
}

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

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-lg font-black text-foreground">{value}</div>
      {sub && <div className="text-[10px] font-mono text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function StorageOverview() {
  const queryClient = useQueryClient();
  const [deletingSystem, setDeletingSystem] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery<StorageSnapshot>({
    queryKey: ["/api/vault/storage-snapshot"],
  });

  const handleDeleteSystem = async (system: string, count: number) => {
    if (!confirm(`Delete all ${count} ROMs for "${systemLabel(system)}"? This removes files and database entries.`)) return;
    setDeletingSystem(system);
    try {
      await apiRequest("POST", "/api/vault/delete-system", { system });
      queryClient.invalidateQueries({ queryKey: ["/api/vault/health"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vault/storage-snapshot"] });
      await refetch();
    } finally {
      setDeletingSystem(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-6 text-xs text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading storage overview…
      </div>
    );
  }

  if (!data) return null;

  const diskPct = data.romStorage?.disk
    ? ((data.romStorage.disk.totalBytes - data.romStorage.disk.freeBytes) / data.romStorage.disk.totalBytes * 100).toFixed(0)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
          <Server className="size-4" />
          Storage Overview
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => refetch()} disabled={isRefetching} className="gap-1.5 text-[10px] font-black uppercase tracking-widest">
          <RefreshCw className={`size-3 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Database className="size-3.5" />} label="Total ROMs" value={(data.totalRoms ?? 0).toLocaleString()} sub={`${(data.bySystem ?? []).length} systems`} />
        <StatCard icon={<HardDrive className="size-3.5" />} label="Total Size" value={fmtBytes(data.totalSize ?? 0)} sub="Across all ROMs" />
        <StatCard
          icon={<FolderOpen className="size-3.5" />}
          label="ROM Storage"
          value={fmtBytes(data.romStorage?.usedBytes ?? 0)}
          sub={diskPct !== null ? `${diskPct}% used of ${fmtBytes(data.romStorage?.disk!.totalBytes ?? 0)}` : data.romStorage?.path ?? ""}
        />
        <StatCard
          icon={<ImageIcon className="size-3.5" />}
          label="Image Cache"
          value={fmtBytes(data.systemImageCache?.size ?? 0)}
          sub={data.systemImageCache?.path ?? ""}
        />
      </div>

      {(data.bySystem ?? []).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Breakdown by System</div>
          <ScrollArea className="max-h-56">
            <div className="space-y-0.5">
              {(data.bySystem ?? []).map((sys) => (
                <div key={sys.system} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/[0.02] group">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-1.5 rounded-full bg-accent shrink-0" />
                    <span className="text-xs font-medium truncate">{systemLabel(sys.system)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                      <span>{sys.count} ROMs</span>
                      <span className="w-16 text-right">{fmtBytes(sys.size)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSystem(sys.system, sys.count)}
                      disabled={deletingSystem === sys.system}
                      className="size-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground disabled:opacity-40"
                      title={`Delete all ${systemLabel(sys.system)} ROMs`}
                    >
                      {deletingSystem === sys.system ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {(data.watchPaths ?? []).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Watch Paths</div>
          <div className="space-y-2">
            {(data.watchPaths ?? []).map((wp) => (
              <div key={wp.path} className="flex items-center justify-between py-2 px-3 rounded-lg border border-white/5 bg-white/[0.01]">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] text-foreground truncate">{wp.path}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {wp.count} files · {fmtBytes(wp.size)} · {wp.imported} imported
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator className="bg-white/5" />

      {data.romStorage?.disk && (
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground justify-center">
          <HardDrive className="size-3" />
          {data.romStorage.path} — {fmtBytes(data.romStorage.disk.freeBytes)} free / {fmtBytes(data.romStorage.disk.totalBytes)} total
        </div>
      )}
    </div>
  );
}
