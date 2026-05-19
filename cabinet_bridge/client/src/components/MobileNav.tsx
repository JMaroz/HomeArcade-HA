import React from "react";
import { Link, useLocation } from "wouter";
import { Wordmark } from "@/components/Logo";
import { LayoutDashboard, Gamepad2, Trophy, Settings, History, QrCode } from "lucide-react";
import { useTranslation } from "react-i18next";

export function MobileTopBar() {
  const [location] = useLocation();

  return (
    <div
      className="flex items-center justify-between px-4 h-14 landscape:h-12 border-b border-white/10 bg-black/90 backdrop-blur-md sticky top-0 z-30"
      data-testid="bar-mobile-top"
    >
      {/* Home button */}
      <Link
        href="/"
        className="size-10 landscape:size-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
        aria-label="Home"
      >
        <LayoutDashboard className="size-5 landscape:size-4 text-primary" />
      </Link>

      {/* Wordmark */}
      <Link href="/" className="flex items-center landscape:scale-90">
        <Wordmark />
      </Link>

      {/* QR + Settings */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.location.href = "/?scan=warp"}
          className="size-10 landscape:size-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 transition-colors text-primary border border-white/10"
          aria-label="Scan Warp Link"
        >
          <QrCode className="size-5 landscape:size-4" />
        </button>
        <Link
          href="/settings"
          className="size-10 landscape:size-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 transition-all text-primary border border-white/10"
          aria-label="Settings"
          data-testid="link-settings-topbar"
        >
          <Settings className="size-5 landscape:size-4" />
        </Link>
      </div>
    </div>
  );
}

/**
 * MD3 Navigation Bar — fixed bottom tab bar.
 * Active tab: pill-shaped indicator under icon, primary color icon+label.
 * Inactive: icon + label, muted foreground.
 * Place once in App.tsx; pages add pb-20 lg:pb-0 to scroll containers.
 */
export function MobileBottomNav() {
  const [location] = useLocation();
  const { t } = useTranslation();

  const tabs = [
    { href: "/",            icon: LayoutDashboard, label: t("nav.home") || "Home"     },
    { href: "/history",     icon: History,         label: t("nav.history") || "History"  },
    { href: "/achievements",icon: Trophy,          label: t("nav.achievements") || "Awards"   },
    { href: "/settings",    icon: Settings,        label: t("nav.settings") || "Settings" },
  ] as const;

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-sidebar/80 backdrop-blur-md transition-[height]"
      data-testid="nav-mobile-bottom"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 landscape:h-12 items-stretch transition-[height]">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/"
              ? location === "/"
              : location === href || location.startsWith(href + "/") || location.startsWith(href + "?");

          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
              data-testid={`nav-bottom-${label.toLowerCase()}`}
              aria-current={isActive ? "page" : undefined}
            >
              {/* MD3 indicator pill — wraps the icon */}
              <span
                className={[
                  "relative flex items-center justify-center h-8 w-16 landscape:h-7 landscape:w-12 rounded-full transition-all duration-200",
                  isActive
                    ? "bg-primary-container"
                    : "bg-transparent",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "transition-all duration-200",
                    isActive ? "size-[22px] landscape:size-5 text-primary" : "size-5 landscape:size-4 text-muted-foreground",
                  ].join(" ")}
                />
              </span>
              {/* MD3 Label Medium — hidden in landscape to save height */}
              <span
                className={[
                  "md-label-small transition-colors landscape:hidden",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground",
                ].join(" ")}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
