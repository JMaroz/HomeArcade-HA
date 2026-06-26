import React, { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { queryClient, apiUrl } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  XCircle, 
  Upload, 
  Download,
  Loader2, 
  AlertCircle,
  FileCode,
  Monitor,
  Cpu,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface BiosStatus {
  filename: string;
  exists: boolean;
  verified: boolean;
  label?: string;
  sourceUrl?: string;
}

interface BiosResponse {
  cores: Record<string, BiosStatus[]>;
  arch: string;
}

interface SystemInfo {
  arch: string;
  platform: string;
  cpuModel: string | null;
  cores: Record<string, string>;
}

const TIER_CONFIG: Record<string, { color: string; label: string }> = {
  excellent: { color: "text-green-500", label: "Full Speed" },
  good: { color: "text-green-400", label: "Most Titles Smooth" },
  playable: { color: "text-yellow-500", label: "Playable" },
  marginal: { color: "text-orange-500", label: "May Struggle" },
  unplayable: { color: "text-red-500", label: "Not Recommended" },
  experimental: { color: "text-purple-400", label: "Experimental Core" },
};

const ARCH_LABELS: Record<string, string> = {
  arm64: "ARM 64-bit",
  x64: "x86 64-bit",
  aarch64: "ARM 64-bit",
};

async function safeJsonOrText(res: Response): Promise<{ message?: string }> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || `Server error (${res.status})` };
  }
}

export function BiosManager() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: biosRes, isLoading } = useQuery<BiosResponse>({
    queryKey: ["/api/bios"],
  });

  const { data: systemInfo } = useQuery<SystemInfo>({
    queryKey: ["/api/system"],
    staleTime: Infinity,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, filename }: { file: File; filename: string }) => {
      const res = await fetch(apiUrl("/api/bios/upload"), {
        method: "POST",
        headers: {
          "x-bios-filename": encodeURIComponent(filename),
          "Content-Type": "application/octet-stream",
        },
        body: file,
      });
      if (!res.ok) {
        const err = await safeJsonOrText(res);
        throw new Error(err.message || "Upload failed");
      }
      return safeJsonOrText(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bios"] });
      toast({
        title: "BIOS Uploaded",
        description: "The system firmware has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message,
      });
    },
    onSettled: () => {
      setUploading(null);
    }
  });

  const downloadMutation = useMutation({
    mutationFn: async (filename: string) => {
      const res = await fetch(apiUrl("/api/bios/download"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (!res.ok) {
        const err = await safeJsonOrText(res);
        throw new Error(err.message || "Download failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bios"] });
      toast({
        title: "BIOS Downloaded",
        description: "File downloaded from retrobios and verified successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error.message,
      });
    },
    onSettled: () => {
      setDownloading(null);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, expectedFilename: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase() !== expectedFilename.toLowerCase()) {
      toast({
        variant: "destructive",
        title: "Filename Mismatch",
        description: `Expected '${expectedFilename}', but got '${file.name}'. Please rename the file and try again.`,
      });
      return;
    }

    setUploading(expectedFilename);
    uploadMutation.mutate({ file, filename: expectedFilename });
  };

  const handleDownload = (filename: string) => {
    setDownloading(filename);
    downloadMutation.mutate(filename);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const formFactor = biosRes?.arch === "arm64" ? "Single-board Computer" : "Desktop / Server";

  return (
    <div className="space-y-6">
      {systemInfo && (
        <div className="p-4 rounded-lg border border-border bg-sidebar/20 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Monitor className="size-4 text-primary" />
            <span className="font-semibold">{ARCH_LABELS[systemInfo.arch] || systemInfo.arch}</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-primary" />
            <span>{systemInfo.cpuModel || formFactor}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">{systemInfo.platform}</span>
        </div>
      )}

      <div className="p-4 rounded-lg border border-accent/20 bg-accent/5 flex gap-3">
        <AlertCircle className="size-5 text-accent shrink-0 mt-0.5" />
        <div className="text-sm text-accent/90 leading-relaxed">
          Some systems require original firmware (BIOS) files to run. Use <strong>Download</strong> to fetch from retrobios, or <strong>Upload</strong> to provide your own.
        </div>
      </div>

      <div className="grid gap-4">
        {biosRes?.cores && Object.entries(biosRes.cores).map(([core, files]) => {
          const tier = systemInfo?.cores?.[core];
          const tierCfg = tier ? TIER_CONFIG[tier] : null;

          return (
            <div key={core} className="p-5 rounded-xl border border-border bg-sidebar/20 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="font-display font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                  <FileCode className="size-4 text-primary" />
                  {core.toUpperCase()} Core
                </div>
                {tierCfg && (
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${tierCfg.color} border border-current/20 rounded px-2 py-0.5`}>
                    {tierCfg.label}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {files.map((file) => {
                  const isProcessing = uploading === file.filename || downloading === file.filename;

                  return (
                    <div key={file.filename} className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border/50">
                      <div className="flex items-center gap-3 min-w-0">
                        {!file.exists ? (
                          <XCircle className="size-4 text-destructive shrink-0" />
                        ) : file.verified ? (
                          <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                        ) : (
                          <AlertCircle className="size-4 text-yellow-500 shrink-0" />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-xs text-foreground font-semibold truncate">
                            {file.filename}
                          </span>
                          {file.exists && !file.verified && (
                            <span className="text-[9px] text-yellow-500/80 font-mono">Invalid checksum (bad dump?)</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-mono uppercase tracking-widest ${
                          !file.exists ? "text-destructive/70" : file.verified ? "text-green-500/70" : "text-yellow-500/70"
                        }`}>
                          {!file.exists ? "Missing" : file.verified ? "Verified" : "Invalid"}
                        </span>

                        {file.sourceUrl && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 gap-1.5 font-mono text-[10px] uppercase tracking-wider"
                            onClick={() => handleDownload(file.filename)}
                            disabled={isProcessing}
                          >
                            {downloading === file.filename ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Download className="size-3" />
                            )}
                            Download
                          </Button>
                        )}

                        <div className="relative">
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => handleFileChange(e, file.filename)}
                            disabled={isProcessing}
                            title={`Upload ${file.filename}`}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 font-mono text-[10px] uppercase tracking-wider"
                            disabled={isProcessing}
                          >
                            {uploading === file.filename ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Upload className="size-3" />
                            )}
                            {file.exists ? "Replace" : "Upload"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
