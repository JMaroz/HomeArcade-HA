import React, { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router, Redirect, useLocation } from "wouter";
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
import { AppBottomNav } from "@/components/MobileNav";
import { AnimatePresence, motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// ... (rest of imports)

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
                <div className="h-dvh min-h-dvh flex w-full overflow-hidden bg-background">
                  <main className="flex-1 flex flex-col min-h-full overflow-hidden relative">
                    <PageTransition>
                      <AppRouter />
                    </PageTransition>
                  </main>
                </div>
                <NowPlayingBar />
                <AppBottomNav />
              </ErrorBoundary>
            </Router>
          </TooltipProvider>
        </IntegrationProvider>
      </ProfileProvider>
    </QueryClientProvider>
  );
}

export default App;