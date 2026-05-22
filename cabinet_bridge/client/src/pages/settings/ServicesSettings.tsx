/**
 * ServicesSettings — Online Services tab content for Settings page.
 * Covers RetroAchievements, TheGamesDB, and ScreenScraper credentials.
 */
import React from "react";
import { useIntegration } from "@/lib/integration";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Trophy } from "lucide-react";
import { Section, Field } from "./SettingsShared";

export function ServicesSettings() {
  const { config, setConfig } = useIntegration();
  const { t } = useTranslation();

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* ── Scraper credentials ─────────────────────────────────────────── */}
      <Section title={t("settings.sections.scrapers.title")} description={t("settings.sections.scrapers.description")}>
        <div className="grid sm:grid-cols-2 gap-6">
          <Field label={t("settings.fields.tgdbApiKey.label")} hint={t("settings.fields.tgdbApiKey.hint")}>
            <Input
              value={config.tgdbApiKey}
              onChange={(e) => setConfig({ tgdbApiKey: e.target.value })}
              placeholder="Your API Key"
              className="font-mono text-sm"
            />
          </Field>
          <div className="grid gap-4">
            <Field label={t("settings.fields.ssUserId.label")}>
              <Input
                value={config.ssUserId}
                onChange={(e) => setConfig({ ssUserId: e.target.value })}
                placeholder="Username"
                className="font-mono text-sm"
              />
            </Field>
            <Field label={t("settings.fields.ssPassword.label")}>
              <Input
                type="password"
                value={config.ssPassword}
                onChange={(e) => setConfig({ ssPassword: e.target.value })}
                placeholder="••••••••"
                className="font-mono text-sm"
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── RetroAchievements ───────────────────────────────────────────── */}
      <Section title={t("settings.sections.retroachievements.title")} description={t("settings.sections.retroachievements.description")}>
        <div className="grid sm:grid-cols-2 gap-6">
          <Field label={t("settings.fields.raUsername.label")}>
            <div className="relative">
              <Trophy className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={config.raUsername}
                onChange={(e) => setConfig({ raUsername: e.target.value })}
                placeholder="RA Username"
                className="pl-9 font-mono text-sm"
              />
            </div>
          </Field>
          <Field label={t("settings.fields.raToken.label")} hint={t("settings.fields.raToken.hint")}>
            <Input
              type="password"
              value={config.raToken}
              onChange={(e) => setConfig({ raToken: e.target.value })}
              placeholder="RA API Key"
              className="font-mono text-sm"
            />
          </Field>
        </div>
      </Section>
    </div>
  );
}
