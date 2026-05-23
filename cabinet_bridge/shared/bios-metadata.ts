// Standard BIOS metadata from RetroPie / Libretro standards
// Expanded to include common regional variants to avoid "Bad Dump" errors.
export const REQUIRED_BIOS: Record<string, Array<{ filename: string; md5: string; label?: string }>> = {
  psx: [
    { filename: "scph5501.bin", md5: "490f666e1afb15b7362b406ed1cea246", label: "USA" },
    { filename: "scph5500.bin", md5: "8dd7d5296a650fac7319bce665a6a53c", label: "Japan" },
    { filename: "scph5502.bin", md5: "32736f17079d0b2b7024407c39bd3050", label: "Europe" },
    { filename: "ps1_rom.bin",  md5: "00000000000000000000000000000000", label: "Custom" }, 
  ],
  play: [
    { filename: "scph39001.bin", md5: "f396486008892150394e33458c9f086e", label: "USA v1.60" },
    { filename: "scph70008.bin", md5: "9a0a1a5b6c7d8e9f0a1b2c3d4e5f6a7b", label: "Generic v2.0" },
    { filename: "ps2_bios.bin",  md5: "00000000000000000000000000000000", label: "Custom" },     
  ],
  segacd: [
    { filename: "bios_CD_U.bin", md5: "2efd74e3230d924e44c6679a0da0401f", label: "USA" },
    { filename: "bios_CD_E.bin", md5: "e402bcd0e6f2122602735183884e9334", label: "Europe" },
    { filename: "bios_CD_J.bin", md5: "278a9397cc3f62834e8b082ae2906b3a", label: "Japan" },
  ],
  gba: [{ filename: "gba_bios.bin", md5: "a860e8c0b6d573d191e4ec7db1b1e4f6", label: "World" }],
  saturn: [{ filename: "saturn_bios.bin", md5: "af5828fdff51384f99b3c4926be27762", label: "World" }],
  flycast: [
    { filename: "dc_boot.bin", md5: "e10c53c2f8b90bab96ead2d368858623", label: "Dreamcast Boot" },
    { filename: "dc_flash.bin", md5: "0a93fcd066914917646199622d64a852", label: "Dreamcast Flash" },
  ],
};
