/**
 * haPublisher.ts
 * Pushes HomeArcade game state to Home Assistant as sensor entities.
 *
 * Uses the Supervisor token (available inside the HA add-on) so no manual
 * long-lived token is required. Falls back to the user-configured haToken
 * if SUPERVISOR_TOKEN is not set (e.g. running outside HA for development).
 *
 * Entities published:
 *   sensor.homearcade_game          — title of the current game ("idle" when none)
 *   sensor.homearcade_system        — console/system id (e.g. "nes", "snes")
 *   sensor.homearcade_player        — active profile name
 *   sensor.homearcade_session_start — ISO timestamp when the session started
 *   sensor.homearcade_play_count    — total play count for the current game
 *   binary_sensor.homearcade_active — "on" while a game is running
 */

import { storage } from "./storage";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSupervisorToken(): string | null {
  return process.env.SUPERVISOR_TOKEN ?? process.env.HASSIO_TOKEN ?? null;
}

async function getToken(): Promise<string | null> {
  const supervisorToken = getSupervisorToken();
  if (supervisorToken) return supervisorToken;
  const settings = await storage.getIntegrationSettings();
  return settings.haToken || null;
}

async function getBaseUrl(): Promise<string> {
  // Inside the add-on, always use the Supervisor proxy
  if (getSupervisorToken()) return "http://supervisor/homeassistant";
  const settings = await storage.getIntegrationSettings();
  return settings.haBaseUrl || "https://homeassistant.local:8123";
}

async function pushState(
  entityId: string,
  state: string,
  attributes: Record<string, unknown> = {},
): Promise<void> {
  const token = await getToken();
  if (!token) return;

  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}/api/states/${entityId}`;
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state, attributes }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Non-fatal — HA may be temporarily unavailable
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface GameStartedPayload {
  romId: number;
  title: string;
  system: string;
  profileName: string;
  playCount?: number;
  genre?: string | null;
  developer?: string | null;
  releaseYear?: number | null;
  artUrl?: string | null;
}

export interface GameEndedPayload {
  romId: number;
  title: string;
  system: string;
  profileName: string;
  durationSeconds: number;
}

/** Push all entities when a game starts */
export async function publishGameStarted(payload: GameStartedPayload): Promise<void> {
  const settings = await storage.getIntegrationSettings();
  if (!settings.haPublishEntities) return;

  const startedAt = new Date().toISOString();

  await Promise.all([
    pushState("binary_sensor.homearcade_active", "on", {
      friendly_name: "HomeArcade Active",
      device_class: "running",
    }),
    pushState("sensor.homearcade_game", payload.title, {
      friendly_name: "HomeArcade Game",
      icon: "mdi:gamepad-variant",
      rom_id: payload.romId,
      system: payload.system,
      genre: payload.genre ?? "Unknown",
      developer: payload.developer ?? "Unknown",
      release_year: payload.releaseYear ?? null,
      art_url: payload.artUrl ?? "",
    }),
    pushState("sensor.homearcade_system", payload.system.toUpperCase(), {
      friendly_name: "HomeArcade System",
      icon: "mdi:controller-classic",
      system_id: payload.system,
    }),
    pushState("sensor.homearcade_player", payload.profileName, {
      friendly_name: "HomeArcade Player",
      icon: "mdi:account-circle",
    }),
    pushState("sensor.homearcade_session_start", startedAt, {
      friendly_name: "HomeArcade Session Start",
      icon: "mdi:clock-start",
      device_class: "timestamp",
    }),
    pushState("sensor.homearcade_play_count", String(payload.playCount ?? 0), {
      friendly_name: "HomeArcade Play Count",
      icon: "mdi:counter",
      unit_of_measurement: "plays",
      state_class: "total_increasing",
    }),
  ]);
}

/** Push all entities when a game ends */
export async function publishGameEnded(payload: GameEndedPayload): Promise<void> {
  const settings = await storage.getIntegrationSettings();
  if (!settings.haPublishEntities) return;

  await Promise.all([
    pushState("binary_sensor.homearcade_active", "off", {
      friendly_name: "HomeArcade Active",
      device_class: "running",
      last_game: payload.title,
      last_system: payload.system,
      last_duration_seconds: payload.durationSeconds,
      last_duration_minutes: Math.round(payload.durationSeconds / 60),
    }),
    pushState("sensor.homearcade_game", "idle", {
      friendly_name: "HomeArcade Game",
      icon: "mdi:gamepad-variant-outline",
      last_game: payload.title,
      last_system: payload.system,
    }),
    pushState("sensor.homearcade_system", "idle", {
      friendly_name: "HomeArcade System",
      icon: "mdi:controller-classic-outline",
    }),
    pushState("sensor.homearcade_session_start", "unavailable", {
      friendly_name: "HomeArcade Session Start",
      icon: "mdi:clock-start",
    }),
  ]);
}

/** Push a one-off test to verify connectivity */
export async function publishTestPing(): Promise<{ ok: boolean; error?: string }> {
  const token = await getToken();
  if (!token) return { ok: false, error: "No token available. Set SUPERVISOR_TOKEN or configure haToken." };

  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}/api/states/sensor.homearcade_test`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state: "connected",
        attributes: { friendly_name: "HomeArcade Test", icon: "mdi:check-circle", tested_at: new Date().toISOString() },
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) return { ok: true };
    const text = await res.text().catch(() => "");
    return { ok: false, error: `HA returned ${res.status}: ${text.slice(0, 200)}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/** Push the 'idle' state for all sensors to ensure discovery in HA */
export async function pushInitialEntities(): Promise<{ ok: boolean; error?: string }> {
  const token = await getToken();
  if (!token) return { ok: false, error: "No token available" };

  try {
    await Promise.all([
      pushState("binary_sensor.homearcade_active", "off", {
        friendly_name: "HomeArcade Active",
        device_class: "running",
      }),
      pushState("sensor.homearcade_game", "idle", {
        friendly_name: "HomeArcade Game",
        icon: "mdi:gamepad-variant-outline",
      }),
      pushState("sensor.homearcade_system", "idle", {
        friendly_name: "HomeArcade System",
        icon: "mdi:controller-classic-outline",
      }),
      pushState("sensor.homearcade_player", "none", {
        friendly_name: "HomeArcade Player",
        icon: "mdi:account-circle-outline",
      }),
      pushState("sensor.homearcade_session_start", "unavailable", {
        friendly_name: "HomeArcade Session Start",
        icon: "mdi:clock-start",
      }),
      pushState("sensor.homearcade_play_count", "0", {
        friendly_name: "HomeArcade Play Count",
        icon: "mdi:counter",
        unit_of_measurement: "plays",
        state_class: "total_increasing",
      }),
    ]);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}
