/**
 * Settings — Main settings page shell.
 * Tab content is split into focused sub-components under ./settings/.
 */
import React from "react";
import { Link } from "wouter";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useIntegration } from "@/lib/integration";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  Check, RotateCcw, ShieldAlert, Loader2,
  Palette, Gamepad2, Database, Activity, Wifi, HelpCircle, Zap,
} from "lucide-react";
import { DisplaySettings } from "./settings/DisplaySettings";
import { ControlsSettings } from "./settings/ControlsSettings";
import { LibrarySettings } from "./settings/LibrarySettings";
import { ServicesSettings } from "./settings/ServicesSettings";
import { AutomationsSettings } from "./settings/AutomationsSettings";
import { BiosManager } from "@/components/BiosManager";
import { Section, Step, Code } from "./settings/SettingsShared";

export default function Settings() {
  const { resetConfig, saveStatus } = useIntegration();
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleReset = () => {
    if (confirm(t("common.reset") + "?")) {
      resetConfig();
      toast({ title: "Settings reset", description: "Integration defaults restored." });
    }
  };

  return (
    <div className="flex h-full">
      <main className="flex-1 min-w-0 flex flex-col bg-background/30 overflow-y-auto overscroll-y-contain">
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border shrink-0 md:hidden">
          <SidebarTrigger />
          <Link href="/" className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors ml-1">
            <Gamepad2 className="size-3.5" /> Dashboard
          </Link>
        </div>

        <div className="max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 space-y-8 pb-24 lg:pb-12">
          {/* Header */}
          <div className="flex flex-col gap-1 mb-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
              {t("settings.header")}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-black leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              {t("settings.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your global arcade experience and interface preferences.
            </p>
            <div className="flex items-center gap-3 mt-2">
              {saveStatus === "saving" && (
                <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  <Loader2 className="size-3 animate-spin" /> {t("common.saveStatus.saving")}
                </div>
              )}
              {saveStatus === "saved" && (
                <div className="flex items-center gap-2 font-mono text-[10px] text-accent uppercase tracking-wider">
                  <Check className="size-3" /> {t("common.saveStatus.saved")}
                </div>
              )}
              {saveStatus === "error" && (
                <div className="flex items-center gap-2 font-mono text-[10px] text-destructive uppercase tracking-wider">
                  <ShieldAlert className="size-3" /> {t("common.saveStatus.error")}
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="display" className="w-full">
            <TabsList className="w-full justify-start bg-[#1a1a1a] border border-white/10 rounded-2xl p-1 mb-8 overflow-x-auto scrollbar-none flex-nowrap shrink-0">
              <TabsTrigger value="display" className="flex-1 gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(176,93,252,0.4)]">
                <Palette className="size-4" /> {t("settings.tabs.display")}
              </TabsTrigger>
              <TabsTrigger value="controls" className="flex-1 gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(176,93,252,0.4)]">
                <Gamepad2 className="size-4" /> {t("settings.tabs.controls")}
              </TabsTrigger>
              <TabsTrigger value="library" className="flex-1 gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(176,93,252,0.4)]">
                <Database className="size-4" /> {t("settings.tabs.library")}
              </TabsTrigger>
              <TabsTrigger value="health" className="flex-1 gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(176,93,252,0.4)]">
                <Activity className="size-4" /> {t("settings.tabs.health")}
              </TabsTrigger>
              <TabsTrigger value="services" className="flex-1 gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(176,93,252,0.4)]">
                <Wifi className="size-4" /> {t("settings.tabs.services")}
              </TabsTrigger>
              <TabsTrigger value="automations" className="flex-1 gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(176,93,252,0.4)]">
                <Zap className="size-4" /> Automations
              </TabsTrigger>
              <TabsTrigger value="help" className="flex-1 gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(176,93,252,0.4)]">
                <HelpCircle className="size-4" /> {t("settings.tabs.help")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="display" className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-8">
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary mb-1">Global Preferences</div>
                <h3 className="font-display text-xl font-bold">Interface &amp; Layout</h3>
                <p className="text-xs text-muted-foreground mt-1">Configure your global arcade experience and interface preferences.</p>
              </div>
              <DisplaySettings />
            </TabsContent>

            <TabsContent value="controls" className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-8">
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary mb-1">Advanced Controls</div>
                <h3 className="font-display text-xl font-bold">Input &amp; Calibration</h3>
                <p className="text-xs text-muted-foreground mt-1">Configure deadzones, haptics, and controller mapping.</p>
              </div>
              <ControlsSettings />
            </TabsContent>

            <TabsContent value="library" className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-8">
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary mb-1">Game Library</div>
                <h3 className="font-display text-xl font-bold">ROM Management</h3>
                <p className="text-xs text-muted-foreground mt-1">Scanner, uploads, and metadata settings.</p>
              </div>
              <LibrarySettings />
            </TabsContent>

            <TabsContent value="health" className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-8">
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary mb-1">System Health</div>
                <h3 className="font-display text-xl font-bold">Diagnostics</h3>
                <p className="text-xs text-muted-foreground mt-1">Monitor BIOS files and system health.</p>
              </div>
              <Section title={t("settings.sections.health.title")} description={t("settings.sections.health.description")}>
                <BiosManager />
              </Section>
            </TabsContent>

            <TabsContent value="services" className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-8">
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary mb-1">Connectivity</div>
                <h3 className="font-display text-xl font-bold">Online Services</h3>
                <p className="text-xs text-muted-foreground mt-1">Configure RetroAchievements, TheGamesDB, and Screenscraper.</p>
              </div>
              <ServicesSettings />
            </TabsContent>

            <TabsContent value="automations" className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="mb-8">
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary mb-1">Home Assistant</div>
                <h3 className="font-display text-xl font-bold">Automations</h3>
                <p className="text-xs text-muted-foreground mt-1">Expose game state as HA entities and trigger automations when you play.</p>
              </div>
              <AutomationsSettings />
            </TabsContent>

            <TabsContent value="help" className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Section title={t("settings.sections.help.title")} description={t("settings.sections.help.description")}>
                <ul className="space-y-6">
                  <Step n={1} title="Add as Sidebar Item (Optional)">
                    Add this to your `configuration.yaml` to see HomeArcade in the HA sidebar:
                    <Code>{`panel_iframe:\n  cabinet:\n    title: "Cabinet"\n    icon: mdi:gamepad-variant\n    url: "\${window.location.origin}\${window.location.pathname}"`}</Code>
                  </Step>
                  <Step n={2} title="Configure PC Sensors">
                    Install <strong>HASS.Agent</strong> or <strong>IOT Link</strong> on your Windows PC to provide CPU, RAM, and Online sensors back to Home Assistant.
                  </Step>
                  <Step n={3} title="Set Up ROM Watch Directory">
                    Set <code>CABINET_ROM_WATCH_DIR</code> in the add-on configuration to enable automatic ROM imports from a folder.
                  </Step>
                </ul>
              </Section>
            </TabsContent>
          </Tabs>

          <Separator className="bg-border/60" />

          {/* Footer actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <ShieldAlert className="size-3.5" />
              {t("settings.autoSaved")}
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5">
              <RotateCcw className="size-3.5" /> {t("settings.buttons.resetDefaults")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
