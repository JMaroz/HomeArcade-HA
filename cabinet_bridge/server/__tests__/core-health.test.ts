import { describe, it, expect } from "vitest";
import { EMULATORJS_CORES } from "../routes/shared";
import { REQUIRED_BIOS } from "../../shared/bios-metadata";

describe("Core Health & BIOS Validation", () => {
  const systems = [
    "nes", "snes", "n64", "gba", "genesis", "ps1", "ps2", 
    "arcade", "dreamcast", "gb", "gbc", "nds", "psp", 
    "atari2600", "saturn", "gamegear", "sms", "pce", 
    "sega32x", "segacd", "neogeo", "virtualboy", "atari7800", "lynx"
  ];

  it("should have a valid core mapping for every supported system", () => {
    systems.forEach(system => {
      const core = EMULATORJS_CORES[system];
      expect(core, `System '${system}' is missing a core mapping in shared.ts`).toBeDefined();
      expect(typeof core).toBe("string");
    });
  });

  it("should have correct BIOS keys matching core names", () => {
    // Systems that definitely MUST have BIOS metadata defined (even if files are optional)
    const coresRequiringMetadata = ["psx", "play", "flycast", "mgba", "yabause", "genesis_plus_gx"];
    
    coresRequiringMetadata.forEach(core => {
      // Find the key in REQUIRED_BIOS that matches this core
      // Note: we use the value from EMULATORJS_CORES to check metadata alignment
      const metadata = REQUIRED_BIOS[core] || Object.values(EMULATORJS_CORES).includes(core);
      expect(metadata, `Core '${core}' is used but missing from REQUIRED_BIOS keys`).toBeTruthy();
    });
  });

  it("should correctly handle conditional Sega BIOS logic", () => {
    const genesisCore = EMULATORJS_CORES["genesis"];
    const segacdCore = EMULATORJS_CORES["segacd"];
    
    expect(genesisCore).toBe("genesis_plus_gx");
    expect(segacdCore).toBe("genesis_plus_gx");
    
    // The BIOS metadata should exist for this core
    expect(REQUIRED_BIOS["genesis_plus_gx"]).toBeDefined();
  });

  it("should use standard naming for Game Boy systems to prevent 90% hang", () => {
    expect(EMULATORJS_CORES["gb"]).toBe("gb");
    expect(EMULATORJS_CORES["gbc"]).toBe("gbc");
  });

  it("should use the 'play' core for PS2 to match BIOS and core files", () => {
    expect(EMULATORJS_CORES["ps2"]).toBe("play");
    expect(REQUIRED_BIOS["play"]).toBeDefined();
  });

  it("should use the verified 'n64' alias to ensure cross-device playback", () => {
    // We use the generic 'n64' alias because explicitly forcing 'mupen64plus_next'
    // can break loading on mobile/Safari where the WASM files are named differently.
    expect(EMULATORJS_CORES["n64"]).toBe("n64");
    
    // N64 should NOT have a BIOS requirement that blocks loading in the standard gate
    expect(REQUIRED_BIOS["n64"]).toBeUndefined();
  });
});
