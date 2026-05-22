/**
 * VaultSettings — Library Intelligence & Batch Management tab content.
 * Covers health dashboard, bulk cleanup, and duplicate finder.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, apiUrl, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ShieldAlert, Trash2, RefreshCw, CheckCircle2, 
  XCircle, Sparkles, Image, FileText, Timer, 
  Search, Link, Copy, Loader2, AlertCircle, Cloud, Globe, Key
} from "lucide-react";
import { Section } from "./SettingsShared";
import { useIntegration } from "@/lib/integration";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface VaultHealth {
  total: number;
  missingArt: number;
  missingDescription: number;
  missingYear: number;
  missingGenre: number;
  failedScrapes: number;
}

interface VaultAudit {
  deadLinks: Array<{ id: number; title: string; path: string }>;
  duplicates: Array<Array<{ id: number; title: string; system: string }>>;
}

interface ScrapeResult {
  id: number;
  title: string;
  status: "success" | "failed";
}

interface ScrapeProgress {
  current: number;
  total: number;
  title?: string;
}

interface ScrapeComplete {
  matched: number;
  failed: number;
  total: number;
}

function HealthCard({ icon, label, count, total, colorClass }: { icon: React.ReactNode, label: string, count: number, total: number, colorClass: string }) {
  const percentage = total > 0 ? Math.round(((total - count) / total) * 100) : 100;
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className={`size-8 rounded-lg flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="font-display font-black text-xl leading-none mt-0.5">{total - count}<span className="text-muted-foreground/30 text-sm font-medium"> / {total}</span></div>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between font-mono text-[9px] uppercase tracking-tighter text-muted-foreground">
          <span>{percentage}% Optimized</span>
          <span>{count} missing</span>
        </div>
        <Progress value={percentage} className="h-1 rounded-full" />
      </div>
    </div>
  );
}

export function VaultSettings() {
  const { t } = useTranslation();
  const { config, setConfig } = useIntegration();
  const { toast } = useToast();
  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState<ScrapeProgress | null>(null);
  const [results, setResults] = useState<ScrapeResult[]>([]);
  const [summary, setSummary] = useState<ScrapeComplete | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [testingDrive, setTestingDrive] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);

  const { data: health, refetch: refetchHealth } = useQuery<VaultHealth>({ queryKey: ["/api/vault/health"] });
  const { data: audit, refetch: refetchAudit } = useQuery<VaultAudit>({ 
    queryKey: ["/api/vault/audit"],
    enabled: false 
  });

  const handleBulkScrape = async () => {
    if (scraping) return;
    setScraping(true);
    setProgress(null);
    setResults([]);
    setSummary(null);

    try {
      const res = await fetch(apiUrl("/api/roms/scrape-all"), { method: "POST" });
      if (!res.ok) throw new Error(res.statusText);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Body reader not available");

      const decoder = new TextDecoder();
      let buffer = "";
      let matched = 0;
      let failed = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "start") setProgress({ current: 0, total: data.total });
            else if (data.type === "progress") setProgress({ current: data.current, total: data.total, title: data.title });
            else if (data.type === "result") {
              if (data.status === "success") matched++; else failed++;
              setResults((prev) => [...prev, { id: data.id, title: data.title, status: data.status }]);
            } else if (data.type === "complete") {
              setSummary({ matched, failed, total: matched + failed });
              await refetchHealth();
              await queryClient.invalidateQueries({ queryKey: ["/api/roms"] });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Bulk scrape failed", description: err.message });
    } finally {
      setScraping(false);
      setProgress(null);
    }
  };

  const runAudit = async () => {
    setAuditing(true);
    await refetchAudit();
    setAuditing(false);
  };

  const testDrive = async () => {
    setTestingDrive(true);
    try {
      const res = await fetch(apiUrl("/api/vault/test-drive"));
      const data = await res.json();
      if (data.ok) {
        toast({ title: "Drive Connected", description: data.message });
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({ title: "Connection Failed", description: err.message, variant: "destructive" });
    } finally {
      setTestingDrive(false);
    }
  };

  const syncCloud = async () => {
    setSyncingCloud(true);
    try {
      const res = await apiRequest("POST", "/api/vault/cloud-sync");
      const data = await res.json();
      toast({ title: "Cloud Sync Complete", description: `Uploaded ${data.uploaded} saves and downloaded ${data.downloaded} newer versions.` });
    } catch (err: any) {
      toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncingCloud(false);
    }
  };

  const pruneDeadLinks = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/vault/prune");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Cleanup complete", description: `Removed ${data.removedCount} dead entries.` });
      void refetchHealth();
      void refetchAudit();
    }
  });

  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* ── Cloud Synchronization ────────────────────────────────────────────── */}
      <Section title="Cloud Synchronization" description="Sync your game saves and screenshots to Google Drive. This allows you to pick up where you left off on any device.">
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Cloud className="size-5 text-primary" />
              </div>
              <div>
                <div className="font-display font-bold text-sm">Google Drive Sync</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                  {config.cloudSaveEnabled ? "Active & Synchronizing" : "Disabled"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
               {config.cloudSaveEnabled && (
                  <Button onClick={syncCloud} disabled={syncingCloud} variant="ghost" size="sm" className="gap-2 h-9 px-4 font-black uppercase tracking-wider text-[10px] text-primary hover:text-primary hover:bg-primary/5">
                    {syncingCloud ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                    Sync Now
                  </Button>
               )}
              <Switch 
                checked={config.cloudSaveEnabled} 
                onCheckedChange={(v) => setConfig({ cloudSaveEnabled: v })} 
              />
            </div>
          </div>

          {config.cloudSaveEnabled && (
            <div className="grid gap-6 p-5 rounded-xl border border-border bg-sidebar/10 animate-in slide-in-from-top-2 duration-300">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">API Credentials</div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider opacity-60">Client ID</Label>
                      <div className="relative">
                        <Globe className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          value={config.googleDriveClientId} 
                          onChange={(e) => setConfig({ googleDriveClientId: e.target.value })}
                          placeholder="000000000000-xxx.apps.googleusercontent.com"
                          className="pl-9 font-mono text-xs h-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider opacity-60">Client Secret</Label>
                      <div className="relative">
                        <Key className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          type="password"
                          value={config.googleDriveClientSecret} 
                          onChange={(e) => setConfig({ googleDriveClientSecret: e.target.value })}
                          placeholder="GOCSPX-xxxxxxxxxxxx"
                          className="pl-9 font-mono text-xs h-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Persistence</div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider opacity-60">Refresh Token</Label>
                      <div className="relative">
                        <RefreshCw className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          type="password"
                          value={config.googleDriveRefreshToken} 
                          onChange={(e) => setConfig({ googleDriveRefreshToken: e.target.value })}
                          placeholder="1//0xxxxxxxxxxxx"
                          className="pl-9 font-mono text-xs h-9"
                        />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200/70 leading-relaxed">
                      <AlertCircle className="size-3 inline mr-1 mb-0.5" />
                      <strong>Setup Guide:</strong> Create a project in Google Cloud Console, enable Drive API, create OAuth Credentials (Web), and use an OAuth playground to get your long-lived Refresh Token.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={testDrive} disabled={testingDrive} variant="outline" size="sm" className="gap-2 h-9 px-4 font-black uppercase tracking-wider text-[10px]">
                  {testingDrive ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                  Test Connection
                </Button>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Separator className="bg-border/60" />

      {/* ── Health Dashboard ─────────────────────────────────────────────────── */}
      <Section title="Library Health" description="Real-time audit of your metadata coverage and storage status.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <HealthCard 
            icon={<Image className="size-4 text-pink-400" />} 
            label="Box Artwork" 
            count={health?.missingArt ?? 0} 
            total={health?.total ?? 0}
            colorClass="bg-pink-400/10"
          />
          <HealthCard 
            icon={<FileText className="size-4 text-blue-400" />} 
            label="Descriptions" 
            count={health?.missingDescription ?? 0} 
            total={health?.total ?? 0}
            colorClass="bg-blue-400/10"
          />
          <HealthCard 
            icon={<Sparkles className="size-4 text-amber-400" />} 
            label="Meta Completeness" 
            count={health?.missingYear ?? 0} 
            total={health?.total ?? 0}
            colorClass="bg-amber-400/10"
          />
        </div>
      </Section>

      <Separator className="bg-border/60" />

      {/* ── Bulk Actions ────────────────────────────────────────────────────── */}
      <Section title="Maintenance Tools" description="Automated workflows to repair and optimize your library.">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Scrape Tool */}
            <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-sidebar/20">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                   <Search className="size-5 text-primary" />
                </div>
                <div>
                   <div className="font-display font-bold text-sm">Deep Metadata Scrape</div>
                   <div className="text-[11px] text-muted-foreground mt-0.5">Attempt to find missing art and info for all games.</div>
                </div>
              </div>
              <Button onClick={handleBulkScrape} disabled={scraping} variant="outline" className="w-full gap-2 font-black uppercase text-[10px] tracking-widest h-10 border-primary/20 hover:bg-primary/10 hover:text-primary">
                 {scraping ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                 {scraping ? "Processing Library..." : "Scrape Missing Meta"}
              </Button>
            </div>

            {/* Cleanup Tool */}
            <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-sidebar/20">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
                   <Trash2 className="size-5 text-destructive" />
                </div>
                <div>
                   <div className="font-display font-bold text-sm">Prune Dead Links</div>
                   <div className="text-[11px] text-muted-foreground mt-0.5">Remove entries for files that have been deleted from disk.</div>
                </div>
              </div>
              <Button onClick={() => pruneDeadLinks.mutate()} disabled={pruneDeadLinks.isPending} variant="outline" className="w-full gap-2 font-black uppercase text-[10px] tracking-widest h-10 border-destructive/20 hover:bg-destructive/10 hover:text-destructive">
                 {pruneDeadLinks.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldAlert className="size-3.5" />}
                 Clean Missing Files
              </Button>
            </div>
          </div>

          {scraping && progress && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2 animate-in slide-in-from-top-2 duration-300">
               <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-primary">
                  <span>{progress.title || "Scraping..."}</span>
                  <span>{pct}% ({progress.current}/{progress.total})</span>
               </div>
               <Progress value={pct} className="h-1.5 rounded-full" />
            </div>
          )}
        </div>
      </Section>

      <Separator className="bg-border/60" />

      {/* ── Duplicate Finder ───────────────────────────────────────────────── */}
      <Section title="Collection Audit" description="Identify inconsistencies and duplicates within your ROM set.">
        <div className="space-y-6">
          <Button onClick={runAudit} disabled={auditing} variant="secondary" className="gap-2 font-black uppercase text-[10px] tracking-widest h-10">
            {auditing ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
            Scan for Duplicates & Inconsistencies
          </Button>

          {audit && (
            <div className="grid gap-6 animate-in fade-in slide-in-from-top-2 duration-500">
              {audit.duplicates.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-500 font-mono text-[10px] uppercase tracking-widest">
                    <Copy className="size-3.5" /> Duplicate Groups Found ({audit.duplicates.length})
                  </div>
                  <div className="space-y-2">
                    {audit.duplicates.map((group, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-[11px] font-mono">
                        {group.map(g => `${g.system.toUpperCase()}: ${g.title}`).join(" ↔ ")}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {audit.deadLinks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-destructive font-mono text-[10px] uppercase tracking-widest">
                    <Link className="size-3.5" /> Dead File Links ({audit.deadLinks.length})
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-destructive/20 bg-destructive/5 divide-y divide-destructive/10">
                    {audit.deadLinks.map(link => (
                      <div key={link.id} className="p-2 text-[10px] font-mono text-muted-foreground truncate">
                        {link.title} <span className="opacity-40 ml-2">({link.path})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {audit.duplicates.length === 0 && audit.deadLinks.length === 0 && (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-green-500">
                  <CheckCircle2 className="size-5" />
                  <div className="text-xs font-bold uppercase tracking-widest">Library is 100% Clean</div>
                </div>
              )}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
