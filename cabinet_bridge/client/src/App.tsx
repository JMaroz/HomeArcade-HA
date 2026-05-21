import React, { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { IntegrationProvider, useIntegration } from "@/lib/integration";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import i18n from "./lib/i18n";
import Dashboard from "@/pages/Dashboard";
import { useTranslation } from "react-i18next";
import { ProfileProvider } from "@/lib/useProfile";
import NotFound from "@/pages/not-found";
import { NowPlayingBar } from "@/components/NowPlayingBar";
import { AnimatePresence, motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <IntegrationProvider>
          <LanguageManager />
          <ScrollRestoration />
          <TooltipProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <ErrorBoundary>
                <SidebarProvider defaultOpen={false}>
                  <div className="h-dvh min-h-dvh flex w-full overflow-hidden bg-background">
                    <Sidebar />
                    <SidebarInset className="flex flex-col min-h-full overflow-hidden relative">
                      <PageTransition>
                        <AppRouter />
                      </PageTransition>
                    </SidebarInset>
                  </div>
                </SidebarProvider>
              </ErrorBoundary>
            </Router>
            <NowPlayingBar />
          </TooltipProvider>
        </IntegrationProvider>
      </ProfileProvider>
    </QueryClientProvider>
  );
}

export default App;