import React from "react";
import { Link, useLocation } from "wouter";
import { Wordmark } from "@/components/Logo";
import { QrCode, Settings, Home, History, Trophy, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileTopBarProps {
  onScannerOpen?: () => void;
}

export function MobileTopBar({ onScannerOpen }: MobileTopBarProps) {
  return (
    <div
      className="flex items-center justify-between px-3 h-14 landscape:h-12 border-b border-primary/30 bg-[#0d0d0d]/95 backdrop-blur-md sticky top-0 z-30 md:hidden"
      data-testid="bar-mobile-top"
    >
      {/* Wordmark */}
      <Link href="/" className="flex items-center landscape:scale-90">
        <Wordmark />
      </Link>

      {/* QR + Settings */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {onScannerOpen && (
          <button
            onClick={onScannerOpen}
            className="size-9 rounded-xl flex items-center justify-center bg-primary/25 hover:bg-primary/40 transition-colors text-primary border-2 border-primary/50 font-bold shadow-[0_0_12px_rgba(176,93,252,0.3)]"
            aria-label="Scan Warp Link"
          >
            <QrCode className="size-5" />
          </button>
        )}
        <Link
          href="/settings"
          className="size-9 rounded-xl flex items-center justify-center bg-primary/25 hover:bg-primary/40 transition-all text-primary border-2 border-primary/50 font-bold shadow-[0_0_12px_rgba(176,93,252,0.3)]"
          aria-label="Settings"
          data-testid="link-settings-topbar"
        >
          <Settings className="size-5" />
        </Link>
      </div>
    </div>
  );
}

export function MobileBottomNav() {
  const [location] = useLocation();

  const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "History", icon: History, href: "/history" },
    { label: "Medals", icon: Trophy, href: "/achievements" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-lg border-t border-white/10 px-6 pb-safe-area-inset-bottom">
      <div className="flex items-center justify-between h-16">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300 relative px-3 py-1 rounded-2xl",
                isActive ? "text-primary" : "text-white/40 hover:text-white/60"
              )}
            >
              {/* Active indicator pill (MD3 style) */}
              {isActive && (
                <div className="absolute inset-0 bg-primary/15 rounded-2xl scale-110 animate-in fade-in zoom-in-95 duration-200" />
              )}
              
              <Icon className={cn("size-5 transition-transform duration-300", isActive && "scale-110")} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
