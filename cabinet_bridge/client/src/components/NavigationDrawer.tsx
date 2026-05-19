import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  LayoutDashboard,
  Library,
  Gamepad2,
  Settings,
  HelpCircle,
  X,
  QrCode,
  ChevronUp,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/library", icon: Library, label: "Library" },
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/history", icon: Gamepad2, label: "Activity" },
  { href: "/achievements", icon: HelpCircle, label: "Achievements" },
];

interface NavigationContextValue {
  openDrawer: () => void;
  closeDrawer: () => void;
}

const NavigationContext = createContext<NavigationContextValue>({
  openDrawer: () => {},
  closeDrawer: () => {},
});

export function useNavigationContext() {
  return useContext(NavigationContext);
}

export function NavigationDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);

  return (
    <NavigationContext.Provider value={{ openDrawer, closeDrawer }}>
      {children}
      <NavigationDrawer open={open} onClose={closeDrawer} />
    </NavigationContext.Provider>
  );
}

function NavigationDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed bottom-0 inset-x-0 z-[70] rounded-t-3xl border border-white/10 bg-[#111]/95 backdrop-blur-xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary">
                Navigation
              </span>
              <button
                onClick={onClose}
                className="size-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Close navigation"
              >
                <ChevronUp className="size-4 text-white/50" />
              </button>
            </div>

            {/* Menu items */}
            <nav className="px-4 pb-8 space-y-1">
              {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className="flex items-center gap-4 px-4 py-4 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 transition-all active:scale-[0.98]"
                >
                  <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <span className="font-display font-bold text-sm uppercase tracking-wider">
                    {label}
                  </span>
                </Link>
              ))}

              {/* QR Scanner shortcut */}
              <Link
                href="/#/?scan=warp"
                onClick={onClose}
                className="flex items-center gap-4 px-4 py-4 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 transition-all active:scale-[0.98]"
              >
                <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <QrCode className="size-5 text-primary" />
                </div>
                <span className="font-display font-bold text-sm uppercase tracking-wider">
                  Scan Warp Link
                </span>
              </Link>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}