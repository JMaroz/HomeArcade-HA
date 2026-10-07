import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import {
  Gamepad2,
  Trophy,
  History,
  Settings,
  Search,
  QrCode,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import { useUI } from "@/App";
import { motion } from "framer-motion";
import { getSystemBrandTheme, type SystemBrandTheme } from "@/lib/systemThemes";

interface ConsoleTopBarProps {
  activeSystemId?: string | null;
  onResetSystem?: () => void;
  onSearchClick?: () => void;
}

export function ConsoleTopBar({
  activeSystemId,
  onResetSystem,
  onSearchClick,
}: ConsoleTopBarProps) {
  const [location] = useHashLocation();
  const { setScannerOpen } = useUI();
  const [brandTheme, setBrandTheme] = useState<SystemBrandTheme>(
    getSystemBrandTheme(activeSystemId)
  );

  useEffect(() => {
    setBrandTheme(getSystemBrandTheme(activeSystemId));
  }, [activeSystemId]);

  const navItems = [
    { label: "Home", href: "/", icon: Gamepad2, active: location === "/" && !activeSystemId },
    { label: "Medaglie", href: "/achievements", icon: Trophy, active: location.startsWith("/achievements") },
    { label: "Storico", href: "/history", icon: History, active: location.startsWith("/history") },
    { label: "Impostazioni", href: "/settings", icon: Settings, active: location.startsWith("/settings") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 sm:px-6 py-2.5 flex items-center justify-between transition-colors duration-300">
      {/* ── Left: Logo & Active Brand Tag ───────────────────────── */}
      <div className="flex items-center gap-4">
        <Link href="/" onClick={() => onResetSystem?.()} className="flex items-center gap-2.5 group cursor-pointer focus:outline-none">
          <div className="size-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
            <Gamepad2 className="size-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-base sm:text-lg text-white leading-none">
              HOME<span className="text-primary font-black">ARCADE</span>
            </span>
            {activeSystemId ? (
              <span className="text-[9px] font-mono text-accent font-bold uppercase tracking-widest mt-0.5 truncate max-w-[140px] sm:max-w-none">
                {brandTheme.brandLabel}
              </span>
            ) : (
              <span className="text-[8px] font-mono text-muted-foreground/60 uppercase tracking-widest mt-0.5 hidden sm:inline">
                CONSOLE LAUNCHER
              </span>
            )}
          </div>
        </Link>

        {/* System Reset Pill (when drilled down into a system) */}
        {activeSystemId && onResetSystem && (
          <button
            onClick={onResetSystem}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-mono text-white transition-all hover:scale-105"
            title="Torna alla visualizzazione completa dei sistemi"
          >
            <X className="size-3 text-white/70" />
            <span className="hidden sm:inline">Tutti i Sistemi</span>
          </button>
        )}
      </div>

      {/* ── Center: Top Navigation Tabs (Desktop & TV) ──────────── */}
      <nav className="hidden md:flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 focus:outline-none ${
                item.active
                  ? "text-white shadow-md"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {item.active && (
                <motion.div
                  layoutId="active-console-tab"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent opacity-90 shadow-[0_0_15px_rgba(var(--primary),0.4)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="size-3.5 relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Right: Search, Warp QR & Settings Shortcuts ─────────── */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Shortcut Button */}
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-muted-foreground hover:text-white transition-all group"
            title="Cerca giochi (Cmd+K o /)"
          >
            <Search className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="hidden lg:inline text-xs">Cerca...</span>
            <kbd className="hidden lg:inline-flex text-[9px] font-mono bg-black/40 px-1.5 py-0.5 rounded text-muted-foreground/60 border border-white/10">
              /
            </kbd>
          </button>
        )}

        {/* Warp Link QR scanner button */}
        <button
          onClick={() => setScannerOpen(true)}
          title="Inquadra Warp QR da smartphone"
          className="size-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center transition-all text-white/70 hover:text-white hover:scale-105"
        >
          <QrCode className="size-4" />
        </button>

        {/* Settings button */}
        <Link
          href="/settings"
          title="Impostazioni"
          className="size-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center transition-all text-white/70 hover:text-white hover:scale-105"
        >
          <Settings className="size-4" />
        </Link>
      </div>
    </header>
  );
}
