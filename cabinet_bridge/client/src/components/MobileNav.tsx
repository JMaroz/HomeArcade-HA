import React from "react";
import { Link, useLocation } from "wouter";
import { Home, History, Trophy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

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
