import React, { lazy, Suspense, useEffect, useState, createContext, useContext } from "react";
import { Switch, Route, Router, Redirect, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { IntegrationProvider, useIntegration } from "@/lib/integration";
import i18n from "./lib/i18n";
import Dashboard from "@/pages/Dashboard";
import { useTranslation } from "react-i18next";
import { ProfileProvider } from "@/lib/useProfile";
import NotFound from "@/pages/not-found";
import { NowPlayingBar } from "@/components/NowPlayingBar";
import { AppBottomNav } from "@/components/MobileNav";
import { AnimatePresence, motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WarpScanner } from "@/components/dashboard-themes/HomeArcadeTheme";
import { Logo } from "@/components/Logo";

/**
 * Cinematic boot sequence that plays once when the app is first opened.
 */
function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 800);
    const timer2 = setTimeout(() => setStage(2), 2200);
    const timer3 = setTimeout(() => onComplete(), 3200);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="relative">
        <AnimatePresence mode="wait">
          {stage === 0 && (
            <motion.div 
              key="stage0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, filter: "blur(20px)" }}
              className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/20"
            >
              System Initializing...
            </motion.div>
          )}
          {stage === 1 && (
            <motion.div 
              key="stage1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 1.1 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative">
                <Logo size={64} className="text-white drop-shadow-[0_0_30px_rgba(var(--primary),0.5)]" />
                <motion.div 
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute inset-0 rounded-full border border-primary/30 scale-150"
                />
              </div>
              <div className="text-center space-y-1">
                <div className="font-display text-xl font-black tracking-tight text-white">HOME<span className="text-primary">ARCADE</span></div>
                <div className="font-mono text-[8px] uppercase tracking-[0.4em] text-primary animate-pulse">Ready for player one</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cyber Background Accents */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
    </motion.div>
  );
}

/**
 * Ensures scroll position is reset or restore correctly on navigation.
 */
function ScrollRestoration() {
  const [loc] = useHashLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc]);
  return null;
}

// Lazy — loaded only when navigated to
const Settings = lazy(() => import("@/pages/Settings"));
const Player = lazy(() => import("@/pages/Player"));
const Achievements = lazy(() => import("@/pages/Achievements"));
const History = lazy(() => import("@/pages/History"));

/**
 * Syncs the i18n language when the integration language setting changes.
 */
function LanguageManager() {
  const { config } = useIntegration();
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = config.language ?? "en";
    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang);
    }
  }, [config.language, i18n]);

  return null;
}

function PageFallback() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

/**
 * Fades the route area in whenever the hash location changes.
 */
function PageTransition({ children }: { children: React.ReactNode }) {
  const [loc] = useHashLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={loc}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/">
        <Dashboard />
      </Route>
      <Route path="/library">
        <Redirect to="/" />
      </Route>
      <Route path="/library/collection/:id">
        <Redirect to="/" />
      </Route>
      <Route path="/library/:filter">
        <Redirect to="/" />
      </Route>
      <Route path="/game/:id">
        {(params) => <Redirect to={`/?game=${params.id}`} />}
      </Route>
      <Route path="/settings">
        <Suspense fallback={<PageFallback />}><Settings /></Suspense>
      </Route>
      <Route path="/play/:id">
        {(params) => <Suspense fallback={<PageFallback />}><Player id={params.id} /></Suspense>}
      </Route>
      <Route path="/history">
        <Suspense fallback={<PageFallback />}><History /></Suspense>
      </Route>
      <Route path="/achievements">
        <Suspense fallback={<PageFallback />}><Achievements /></Suspense>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

/* ── Global UI Context ── */
interface UIContextType {
  setScannerOpen: (open: boolean) => void;
}
const UIContext = createContext<UIContextType | undefined>(undefined);
export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
};

function App() {
  const [showScanner, setShowScanner] = useState(false);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <IntegrationProvider>
          <UIContext.Provider value={{ setScannerOpen: setShowScanner }}>
            <AnimatePresence>
              {booting && <BootSequence onComplete={() => setBooting(false)} />}
            </AnimatePresence>
            
            <LanguageManager />
            <ScrollRestoration />
            <TooltipProvider>
              <Toaster />
              <Router hook={useHashLocation}>
                <ErrorBoundary>
                  <div className="h-dvh min-h-dvh flex w-full overflow-hidden bg-background">
                    <main className="flex-1 flex flex-col min-h-full overflow-hidden relative">
                      <PageTransition>
                        <AppRouter />
                      </PageTransition>
                    </main>
                  </div>
                  <NowPlayingBar />
                  <AppBottomNav />

                  {showScanner && (
                    <WarpScanner
                      onClose={() => setShowScanner(false)}
                      onScan={(url) => {
                        setShowScanner(false);
                        window.location.href = url;
                      }}
                    />
                  )}
                </ErrorBoundary>
              </Router>
            </TooltipProvider>
          </UIContext.Provider>
        </IntegrationProvider>
      </ProfileProvider>
    </QueryClientProvider>
  );
}

export default App;
