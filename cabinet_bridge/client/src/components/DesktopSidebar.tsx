/**
 * DesktopSidebar — fixed left sidebar for md+ screens.
 * Shared across all pages for consistent desktop navigation.
 */
import React from "react";
import { Link, useLocation } from "wouter";
import {
  Gamepad2,
  History,
  Settings,
  HelpCircle,
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}

export function SidebarNavItem({ href, icon: Icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
        active
          ? "bg-primary text-on-primary rounded-lg"
          : "text-on-surface-variant hover:bg-white/5"
      }`}
    >
      <Icon className="size-5" />
      <span className="text-sm">{label}</span>
    </Link>
  );
}

export function DesktopSidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <aside className="hidden md:flex flex-col h-full py-6 bg-surface-container-low w-80 fixed left-0 top-0 z-50 border-r border-white/5">
      {/* Brand */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <Gamepad2 className="text-on-primary size-5" />
        </div>
        <span className="text-headline-lg font-bold text-primary">HomeArcade</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2">
        <SidebarNavItem href="/" icon={Gamepad2} label="Library" active={isActive("/") && !location.startsWith("/game") && !location.startsWith("/history")} />
        <SidebarNavItem href="/history" icon={History} label="History" active={isActive("/history")} />
        <SidebarNavItem href="/settings" icon={Settings} label="Settings" active={isActive("/settings")} />
        <SidebarNavItem href="/support" icon={HelpCircle} label="Support" />
      </nav>

      {/* User profile at bottom */}
      <div className="px-4 mt-auto">
        <div className="flex items-center gap-4 p-4 rounded-xl glass-panel">
          <img
            alt="Player One"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDITq9XgXrK7vLz3wLGYsMNdHqSzS_Q3BadsLhv417EA9W7A5gz4AmYgbudeSdFMzItSKbSraMIdpRra-hM7StslSn5TD3mnVa8qPTJiba2eG6gc9frmpllvsTEXY6kqi0SCfL35zyChzEVBFoaXFZoAZMljZj8vlfOf4eWb4XthVDDtAJrhUqPYTVJ9sDAC2NXEUceToOBv84PsuhPno1zszO02Z8PZbo2Z2yVwSd7lY3moS1wV6Uh7YleyswdxkncPlHxRrE9Rg"
            className="w-12 h-12 rounded-full border-2 border-primary/50 object-cover"
          />
          <div>
            <p className="font-bold text-on-surface">Player One</p>
            <p className="text-xs text-on-surface-variant">Level 42 Master</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[10px] text-green-400 font-label-sm">Online</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}