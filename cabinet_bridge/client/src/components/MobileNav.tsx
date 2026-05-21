import React from "react";
import { Link, useLocation } from "wouter";
import { Home, History, Trophy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function AppBottomNav() {
  const [location] = useLocation();

  const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "History", icon: History, href: "/history" },
    { label: "Medals", icon: Trophy, href: "/achievements" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none px-6">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div 
          className={cn(
            "relative flex items-center justify-around h-16 px-2",
            "bg-black/40 backdrop-blur-2xl rounded-[28px]",
            "border border-white/[0.08] border-t-white/[0.15]",
            "shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(176,93,252,0.1)]",
            "overflow-hidden"
          )}
        >
          {/* Subtle bottom glow */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1/2 h-4 bg-primary/20 blur-2xl rounded-full" />

          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[64px] h-12 transition-all duration-500 rounded-2xl relative",
                  isActive ? "text-primary" : "text-white/30 hover:text-white/50"
                )}
              >
                {/* Active Indicator Background */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 bg-primary/10 rounded-2xl border border-primary/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                    >
                      {/* Inner Shine */}
                      <div className="absolute inset-x-2 top-1 h-px bg-white/10" />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.15 : 1,
                    y: isActive ? -1 : 0 
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative z-10"
                >
                  <Icon className="size-5" strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>

                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, y: 5, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 2, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="text-[9px] font-black uppercase tracking-[0.15em] mt-1 relative z-10"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
