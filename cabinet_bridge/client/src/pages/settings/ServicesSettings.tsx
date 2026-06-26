/**
 * ServicesSettings — Online Services tab content for Settings page.
 * Covers RetroAchievements only (art uses free Libretro thumbnails).
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
