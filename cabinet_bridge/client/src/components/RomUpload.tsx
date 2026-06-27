import { useRef, useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SYSTEMS, type SystemId, formatRomSize } from "@/data/library";
import { apiRequest, apiUrl, queryClient } from "@/lib/queryClient";
import type { UploadedRom } from "@shared/schema";
import { FileArchive, Upload, X, Zap, CheckCircle2, Sparkles } from "lucide-react";
import { DuplicateDialog, type DuplicateEntry, type DuplicateAction } from "./DuplicateDialog";

type UploadLimits = {
  maxUploadMb: number;
  maxUploadBytes: number;
  allowedExtensions: Record<string, string[]>;
};

interface RomUploadProps {
  /**
   * When provided, uploads are pinned to this system and the picker is hidden.
   * When omitted, the user must select a system before uploading.
   */
  system?: SystemId;
  /** Visual variant — "card" matches the Settings dropzone, "inline" is tighter for system pages. */
  variant?: "card" | "inline";
}

type FileStatus = "pending" | "uploading" | "uploaded" | "failed" | "cancelled" | "skipped";

interface FileEntry {
  file: File;
  status: FileStatus;
  error?: string;
  uploadedRom?: UploadedRom;
  duplicateRomId?: number;
  abort?: AbortController;
  folder?: string;
}

interface UploadProgress {
  fileIndex: number;
  total: number;
  fileName: string;
  filePct: number;
  overallPct: number;
  speedBytesPerSec: number;
  etaSeconds: number;
  currentFileBytes: number;
  currentFileTotal: number;
}

/** Upload a single file via XHR with speed tracking + abort support. */
function xhrUpload(
  file: File,
  url: string,
  signal: AbortSignal,
  onProgress: (pct: number, loadedBytes: number, totalBytes: number, speed: number) => void,
): Promise<UploadedRom> {
  const xhrLog = `[Upload] ${file.name} → ${url}`;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("X-ROM-Filename", encodeURIComponent(file.name));

    // Speed tracking — sliding window of last 3 samples
    const window: { time: number; loaded: number }[] = [];
    function computeSpeed(loaded: number): number {
      const now = performance.now();
      window.push({ time: now, loaded });
      while (window.length > 1 && now - window[0].time > 3000) window.shift();
      if (window.length < 2) return 0;
      const dt = (now - window[0].time) / 1000;
      const dl = loaded - window[0].loaded;
      return dt > 0 ? dl / dt : 0;
    }

    xhr.upload.addEventListener("progress", (e) => {
      if (!e.lengthComputable) return;
      const pct = Math.round((e.loaded / e.total) * 100);
      const speed = computeSpeed(e.loaded);
      onProgress(pct, e.loaded, e.total, speed);
    });
    xhr.addEventListener("load", () => {
      console.debug(xhrLog, "status:", xhr.status);
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText) as UploadedRom); }
        catch (e) { console.error(xhrLog, "JSON parse error:", e); reject(new Error("Invalid server response")); }
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try { msg = (JSON.parse(xhr.responseText) as { message?: string }).message ?? msg; } catch { /* ignore */ }
        console.error(xhrLog, msg);
        reject(new Error(msg));
      }
    });
    xhr.addEventListener("error", () => { console.error(xhrLog, "Network error"); reject(new Error("Network error during upload")); });
    xhr.addEventListener("abort", () => { console.debug(xhrLog, "Aborted"); reject(new Error("Upload cancelled")); });
    signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

type DetectResult = {
  candidates: string[];
  confidence: "high" | "medium" | "low";
};

export function RomUpload({ system: fixedSystem, variant = "card" }: RomUploadProps) {
  const [pickedSystem, setPickedSystem] = useState<string>(fixedSystem ?? "");
  const system = fixedSystem ?? pickedSystem;
  const systemMeta = SYSTEMS.find((s) => s.id === system);
  const [favorite, setFavorite] = useState(true);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedIds, setUploadedIds] = useState<number[]>([]);
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<{ matched: number; total: number } | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectResult, setDetectResult] = useState<DetectResult | null>(null);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState<DuplicateEntry[] | null>(null);
  const [pendingActions, setPendingActions] = useState<Map<string, DuplicateAction> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const { data: limits } = useQuery<UploadLimits>({
    queryKey: ["/api/upload-limits"],
  });
  const maxUploadBytes = limits?.maxUploadBytes ?? 2048 * 1024 * 1024;
  const maxUploadMb = limits?.maxUploadMb ?? 2048;
  const rawFiles = files.map((e) => e.file);
  const oversize = rawFiles.find((f) => f.size > maxUploadBytes);

  // ── Auto-detect system from first file ─────────────────────────────
  const detectSystem = useCallback(async (file: File, folderName?: string) => {
    setDetecting(true);
    setDetectResult(null);
    setDetectError(null);
    try {
      const head = file.slice(0, 65536);
      let url = `/api/upload/detect?filename=${encodeURIComponent(file.name)}`;
      if (folderName) url += `&folder=${encodeURIComponent(folderName)}`;
      const res = await fetch(apiUrl(url), { method: "POST", body: head });
      if (!res.ok) throw new Error("Detection request failed");
      const result: DetectResult = await res.json();
      setDetectResult(result);
      if (result.confidence !== "low" && result.candidates.length >= 1) {
        setPickedSystem(result.candidates[0]);
      }
    } catch (err: any) {
      setDetectError(err.message ?? "Detection failed");
    } finally {
      setDetecting(false);
    }
  }, []);

  const firstEntry = files[0];
  const firstFile = firstEntry?.file;
  const firstFolder = firstEntry?.folder;
  useEffect(() => {
    if (fixedSystem || !firstFile || detectResult) return;
    if (firstFile.size === 0) return;
    detectSystem(firstFile, firstFolder);
  }, [firstFile, firstFolder, fixedSystem, detectSystem, detectResult]);

  const mergeFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    setDetectResult(null);
    setDetectError(null);
    setUploadDone(false);
    setFiles((prev) => {
      const seen = new Set(prev.map((e) => `${e.file.name}:${e.file.size}`));
      const merged = [...prev];
      for (const f of incoming) {
        const key = `${f.name}:${f.size}`;
        if (!seen.has(key)) { seen.add(key); merged.push({ file: f, status: "pending" }); }
      }
      return merged;
    });
  };

  const cancelFile = useCallback((index: number) => {
    setFiles((prev) => {
      const entry = prev[index];
      if (!entry || entry.status !== "uploading") return prev;
      entry.abort?.abort();
      const next = [...prev];
      next[index] = { ...entry, status: "cancelled" };
      return next;
    });
  }, []);

  const cancelAll = useCallback(() => {
    setFiles((prev) => {
      for (const entry of prev) {
        if (entry.status === "uploading") entry.abort?.abort();
      }
      return prev.map((e) =>
        e.status === "uploading" || e.status === "pending"
          ? { ...e, status: "cancelled" as FileStatus }
          : e,
      );
    });
  }, []);

  const upload = useMutation({
    mutationFn: async () => {
      console.debug("[Upload] mutationFn start", { system, files: files.length, pendingActions: !!pendingActions });
      if (!system) throw new Error("Choose a console first.");
      if (files.length === 0) throw new Error("Choose one or more ROM files first.");
      const tooBig = rawFiles.find((f) => f.size > maxUploadBytes);
      if (tooBig) {
        throw new Error(
          `${tooBig.name} is ${formatRomSize(tooBig.size)}, which exceeds the ${maxUploadMb} MB limit.`,
        );
      }

      const uploaded: UploadedRom[] = [];
      const total = files.length;
      const actions = pendingActions;

      for (let i = 0; i < total; i++) {
        const entry = files[i];
        if (entry.status === "cancelled") continue;

        // Apply duplicate actions
        const action = actions?.get(entry.file.name);
        if (action === "skip") {
          setFiles((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], status: "skipped" };
            return next;
          });
          continue;
        }

        const abortController = new AbortController();
        setFiles((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], status: "uploading", abort: abortController };
          return next;
        });

        const file = entry.file;
        const basePct = Math.round((i / total) * 100);

        let url: string;
        if (action === "replace" && entry.duplicateRomId) {
          url = apiUrl(`/api/roms/${entry.duplicateRomId}/replace`);
        } else {
          url = apiUrl(`/api/roms/upload?system=${encodeURIComponent(system)}&favorite=${favorite ? "1" : "0"}`);
        }

        try {
          const rom = await xhrUpload(
            file,
            url,
            abortController.signal,
            (filePct, loadedBytes, totalBytes, speed) => {
              setProgress({
                fileIndex: i,
                total,
                fileName: file.name,
                filePct,
                overallPct: Math.round(basePct + (filePct / total)),
                speedBytesPerSec: speed,
                etaSeconds: speed > 0 ? Math.round((totalBytes - loadedBytes) / speed) : 0,
                currentFileBytes: loadedBytes,
                currentFileTotal: totalBytes,
              });
            },
          );

          setFiles((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], status: "uploaded", uploadedRom: rom };
            return next;
          });
          uploaded.push(rom);
        } catch (err: any) {
          const wasCancelled = err?.message === "Upload cancelled";
          console.error("[Upload] File failed:", i, file.name, err);
          setFiles((prev) => {
            const next = [...prev];
            next[i] = {
              ...next[i],
              status: wasCancelled ? "cancelled" : "failed",
              error: err?.message ?? String(err),
            };
            return next;
          });
          if (!wasCancelled) continue;
        }
      }

      return uploaded;
    },
    onSuccess: async (uploaded) => {
      setProgress(null);
      setScrapeResult(null);
      setUploadedIds(uploaded.map((r) => r.id));
      setUploadDone(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/roms"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/collections"] }),
      ]);
    },
    onError: () => {
      setProgress(null);
    },
  });

  // ── Duplicate check before upload ─────────────────────────────────
  const handleUploadClick = async () => {
    console.debug("[Upload] handleUploadClick", { system: system, files: files.length });
    if (!system || files.length === 0) return;

    // Check for duplicates
    try {
      console.debug("[Upload] Checking duplicates…");
      const res = await fetch(apiUrl("/api/upload/check-duplicates"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: files.map((e) => ({ name: e.file.name, size: e.file.size })),
        }),
      });
      console.debug("[Upload] Duplicate check response:", res.status);
      if (!res.ok) throw new Error("Duplicate check failed");
      const data = await res.json() as {
        results: { originalName: string; duplicate: UploadedRom | null }[];
      };

      const found: DuplicateEntry[] = [];
      for (const r of data.results) {
        const dup = r.duplicate;
        if (!dup) continue;
        setFiles((prev) => {
          const idx = prev.findIndex((e) => e.file.name === r.originalName);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = { ...next[idx], duplicateRomId: dup.id };
          return next;
        });
        found.push({ originalName: r.originalName, size: 0, existingRom: dup });
      }

      if (found.length > 0) {
        setDuplicateDialog(found);
      } else {
        setPendingActions(null);
        upload.mutate();
      }
    } catch {
      // If check fails, proceed with upload anyway
      setPendingActions(null);
      upload.mutate();
    }
  };

  const handleDuplicateConfirm = (actions: Map<string, DuplicateAction>) => {
    setDuplicateDialog(null);
    setPendingActions(actions);
    // Defer to next tick so state updates before mutation
    setTimeout(() => upload.mutate(), 0);
  };

  const scrapeUploadedArt = async () => {
    if (uploadedIds.length === 0) return;
    setScraping(true);
    let matched = 0;
    for (const id of uploadedIds) {
      try {
        const res = await fetch(apiUrl(`/api/roms/${id}/scrape-art`), { method: "POST" });
        const data = await res.json() as { artUrl?: string };
        if (data.artUrl) matched++;
      } catch { /* ignore per-rom errors */ }
    }
    setScrapeResult({ matched, total: uploadedIds.length });
    setScraping(false);
    await queryClient.invalidateQueries({ queryKey: ["/api/roms"] });
  };

  const totalUploaded = files.filter((e) => e.status === "uploaded").length;
  const totalFailed = files.filter((e) => e.status === "failed").length;
  const totalCancelled = files.filter((e) => e.status === "cancelled").length;
  const anyUploading = files.some((e) => e.status === "uploading");

  const targetLabel = systemMeta ? `${systemMeta.shortName} ROMs` : "ROMs";
  const headingCopy = fixedSystem && systemMeta
    ? `Upload ${systemMeta.shortName} ROMs`
    : "Upload ROMs";
  const helperCopy = fixedSystem && systemMeta
    ? `Saved as ${systemMeta.name}. .nes .sfc .gba .z64 .iso .zip .7z — up to ${maxUploadMb} MB each.`
    : ``;

  return (
    <div
      className={`rounded-lg border border-border bg-background/40 ${variant === "inline" ? "p-3 sm:p-4" : "p-4"} space-y-3`}
      data-testid="rom-upload"
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h3 className="font-display text-sm font-semibold tracking-tight">{headingCopy}</h3>
        {helperCopy ? (
          <p className="text-[11px] text-muted-foreground mt-0.5">{helperCopy}</p>
        ) : null}
      </div>

      {/* ── System picker / auto-detect (hidden when system is fixed) ──────── */}
      {!fixedSystem ? (
        <div className="space-y-1.5">
          {detecting ? (
            <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background/60 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 animate-pulse shrink-0" />
              Detecting system…
            </div>
          ) : detectResult && systemMeta ? (
            <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-accent/30 bg-accent/5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-accent shrink-0" />
              <span>{detectResult.confidence === "high" ? "Detected:" : "Best guess:"} <strong className="text-foreground">{systemMeta.shortName}</strong></span>
              <button
                type="button"
                onClick={() => { setPickedSystem(""); setDetectResult(null); }}
                className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Change
              </button>
            </div>
          ) : (
            <select
              value={pickedSystem}
              onChange={(e) => setPickedSystem(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              data-testid="select-rom-system"
            >
              <option value="">
                {detectResult && detectResult.candidates.length > 0
                  ? `Select console… (detected: ${detectResult.candidates.join(", ")})`
                  : "Select a console…"}
              </option>
              {SYSTEMS.map((s) => (
                <option key={s.id} value={s.id}>{s.shortName} — {s.name}</option>
              ))}
            </select>
          )}
          {detectError ? (
            <p className="text-[10px] text-destructive font-mono">Detection: {detectError}</p>
          ) : null}
          {!detecting && !detectResult && !pickedSystem ? (
            <p className="text-[11px] text-muted-foreground">
              Select a console or drop your ROM file to auto-detect.
              .nes .sfc .gba .z64 .iso .zip .7z — up to {maxUploadMb} MB each.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ── Hidden inputs: single files + folder ───────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => { mergeFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }}
        data-testid="input-rom-file"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="sr-only"
        /* @ts-ignore - webkitdirectory is a Chromium-specific attribute */
        webkitdirectory=""
        onChange={(e) => {
          const allFiles = Array.from(e.target.files ?? []);
          if (allFiles.length === 0) return;
          // Use the top-level folder name for auto-detection
          const topFolder = allFiles[0].webkitRelativePath?.split("/")[0];
          if (topFolder) {
            setFiles((prev) => {
              const seen = new Set(prev.map((e) => `${e.file.name}:${e.file.size}`));
              const merged = [...prev];
              for (const f of allFiles) {
                const key = `${f.name}:${f.size}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  merged.push({ file: f, status: "pending", folder: topFolder });
                }
              }
              return merged;
            });
            setDetectResult(null);
            setDetectError(null);
            setUploadDone(false);
          }
          e.target.value = "";
        }}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); }
        }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); mergeFiles(Array.from(e.dataTransfer.files ?? [])); }}
        className={`flex items-center justify-center gap-3 rounded-md border-2 border-dashed px-4 py-3 cursor-pointer transition-colors ${
          dragActive
            ? "border-accent bg-accent/10"
            : "border-border bg-background/40 hover:border-accent/60 hover:bg-accent/5"
        }`}
        data-testid="dropzone-rom-file"
      >
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="font-mono uppercase tracking-wider shrink-0"
            data-testid="button-browse-rom-files"
          >
            Browse {targetLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground shrink-0"
            data-testid="button-browse-rom-folder"
          >
            Upload Folder
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground hidden sm:block">or drag &amp; drop here</p>
      </div>

      {/* ── Selected file list / status table ──────────────────────────────── */}
      {files.length > 0 ? (
        <div className="rounded-md border border-border bg-card/50 p-3" data-testid="text-selected-rom">
          <div className="flex items-center justify-between gap-2 text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <FileArchive className="size-4 text-accent shrink-0" />
              <span className="truncate">
                {files.length} file{files.length === 1 ? "" : "s"} ·{" "}
                {formatRomSize(rawFiles.reduce((sum, f) => sum + f.size, 0))}
              </span>
            </div>
            {!anyUploading ? (
              <button
                type="button"
                onClick={() => { setFiles([]); setDetectResult(null); setDetectError(null); setUploadDone(false); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground shrink-0"
                data-testid="button-clear-rom-files"
              >
                Clear
              </button>
            ) : (
              <button
                type="button"
                onClick={cancelAll}
                className="font-mono text-[10px] uppercase tracking-wider text-destructive hover:text-destructive/80 shrink-0"
              >
                Cancel All
              </button>
            )}
          </div>
          <ul className="mt-2 space-y-1 text-[11px] font-mono">
            {files.map((entry, idx) => {
              const { file, status, error } = entry;
              const statusColor =
                status === "uploaded" ? "text-status-online" :
                status === "failed" ? "text-destructive" :
                status === "cancelled" ? "text-muted-foreground" :
                status === "uploading" ? "text-accent" :
                "text-muted-foreground";
              const statusLabel =
                status === "pending" ? "⏳" :
                status === "uploading" ? "▲" :
                status === "uploaded" ? "✓" :
                status === "failed" ? "✗" :
                status === "cancelled" ? "—" : "";
              return (
                <li key={`${file.name}-${file.size}`} className={`flex items-center justify-between gap-2 ${statusColor}`}>
                  <span className="truncate">{statusLabel} {file.name} · {formatRomSize(file.size)}</span>
                  {status === "uploading" ? (
                    <button
                      type="button"
                      onClick={() => cancelFile(idx)}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                      aria-label={`Cancel ${file.name}`}
                    >
                      <X className="size-3" />
                    </button>
                  ) : status === "pending" || status === "failed" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setFiles((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="size-3" />
                    </button>
                  ) : null}
                  {error ? (
                    <span className="text-[10px] text-destructive truncate max-w-[120px]" title={error}>
                      {error}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* ── Upload progress (speed, ETA, bars) ────────────────────────────────── */}
      {progress && anyUploading ? (
        <div className="rounded-md border border-border bg-card/50 p-3 space-y-2" data-testid="upload-progress">
          {/* File name + count */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileArchive className="size-4 text-accent shrink-0" />
              <span className="text-[11px] font-mono text-muted-foreground truncate">
                {progress.fileName}
              </span>
            </div>
            {progress.total > 1 && (
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                {progress.fileIndex + 1} / {progress.total}
              </span>
            )}
          </div>

          {/* Per-file progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>{progress.total > 1 ? "Current file" : "Uploading"}</span>
              <span>{progress.filePct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-150"
                style={{ width: `${progress.filePct}%` }}
              />
            </div>
            {/* Speed + ETA */}
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>
                {progress.speedBytesPerSec > 0
                  ? `${formatRomSize(progress.speedBytesPerSec)}/s`
                  : "..."}
              </span>
              <span>
                {progress.etaSeconds > 0
                  ? `ETA ${progress.etaSeconds < 60
                      ? `${progress.etaSeconds}s`
                      : `${Math.floor(progress.etaSeconds / 60)}m ${progress.etaSeconds % 60}s`}`
                  : progress.filePct === 100
                  ? "Finalizing…"
                  : ""}
              </span>
            </div>
          </div>

          {/* Overall progress bar (multi-file only) */}
          {progress.total > 1 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>Overall</span>
                <span>{progress.overallPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent/50 transition-all duration-150"
                  style={{ width: `${progress.overallPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* ── Error / success banners ──────────────────────────────────────────── */}
      {oversize ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive" data-testid="warn-rom-upload-size">
          {oversize.name} is {formatRomSize(oversize.size)}, larger than the {maxUploadMb} MB limit.
          Raise <code>max_upload_mb</code> in add-on options and restart.
        </div>
      ) : null}

      {uploadDone && (totalFailed > 0 || totalCancelled > 0) && totalUploaded > 0 ? (
        <div className="rounded-md border border-status-warning/40 bg-status-warning/10 px-3 py-2 text-xs text-status-warning" data-testid="warn-rom-upload-partial">
          {totalUploaded} uploaded, {totalFailed} failed, {totalCancelled} cancelled.
        </div>
      ) : null}

      {upload.isError && totalUploaded === 0 ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive" data-testid="error-rom-upload">
          {(upload.error as Error).message}
        </div>
      ) : null}

      {uploadDone && uploadedIds.length > 0 ? (
        <div className="rounded-md border border-status-online/40 bg-status-online/10 px-3 py-2.5 space-y-2" data-testid="success-rom-upload">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-status-online">
              {fixedSystem && systemMeta
                ? `${systemMeta.shortName} ROMs added — they should appear in the grid below.`
                : `${uploadedIds.length} ROM${uploadedIds.length !== 1 ? "s" : ""} added.`}
            </p>
          </div>
          {scrapeResult ? (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-status-online">
              <CheckCircle2 className="size-3.5 shrink-0" />
              Art fetched: {scrapeResult.matched}/{scrapeResult.total} matched
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void scrapeUploadedArt()}
              disabled={scraping}
              className="inline-flex items-center gap-1.5 rounded border border-status-online/40 bg-status-online/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-status-online hover:bg-status-online/20 disabled:opacity-50 transition-colors"
            >
              {scraping
                ? <><Upload className="size-3 animate-bounce" /> Fetching art…</>
                : <><Zap className="size-3" /> Fetch art for {uploadedIds.length} ROM{uploadedIds.length !== 1 ? "s" : ""}</>}
            </button>
          )}
        </div>
      ) : null}

      {/* ── Duplicate resolution dialog ──────────────────────────────────────── */}
      {duplicateDialog ? (
        <DuplicateDialog
          duplicates={duplicateDialog}
          onConfirm={handleDuplicateConfirm}
          onCancel={() => { setDuplicateDialog(null); setPendingActions(null); }}
        />
      ) : null}

      {/* ── Footer: favorite toggle + upload button ──────────────────────────── */}
      {!uploadDone ? (
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-2">
            <Switch
              id="rom-favorite"
              checked={favorite}
              onCheckedChange={(checked) => setFavorite(!!checked)}
              data-testid="switch-rom-favorite"
            />
            <Label htmlFor="rom-favorite" className="text-sm cursor-pointer">
              Add to Favorites
            </Label>
          </div>
          <Button
            onClick={handleUploadClick}
            disabled={!system || files.length === 0 || anyUploading || !!oversize || detecting}
            className="font-mono uppercase tracking-wider shrink-0"
            data-testid="button-upload-rom"
          >
            <Upload className="size-4 mr-2" />
            {anyUploading
              ? `Uploading${progress ? ` ${progress.filePct}%` : "…"}`
              : files.length > 1
              ? `Upload ${files.length} ${systemMeta ? systemMeta.shortName + " " : ""}ROMs`
              : `Upload ${systemMeta ? systemMeta.shortName + " " : ""}ROM`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
