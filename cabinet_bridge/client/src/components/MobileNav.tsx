import React from "react";
import { Link } from "wouter";
import { Wordmark } from "@/components/Logo";
import { QrCode, Settings } from "lucide-react";

interface MobileTopBarProps {
  onScannerOpen?: () => void;
}

export function MobileTopBar({ onScannerOpen }: MobileTopBarProps) {
  return (
    <div
      className="flex items-center justify-between px-3 h-14 landscape:h-12 border-b border-primary/30 bg-[#0d0d0d]/95 backdrop-blur-md sticky top-0 z-30"
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
